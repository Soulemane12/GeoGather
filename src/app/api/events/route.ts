import { NextResponse } from "next/server";
import type { NormalizedEvent } from "@/lib/types";
import { extractIntent } from "../providers/groq-intent";
import { fetchTicketmaster } from "../providers/ticketmaster";
import { fetchSerpEvents } from "../providers/serp";  // NEW

function dedupe(events: NormalizedEvent[]) {
  const seen = new Map<string, NormalizedEvent>();
  for (const e of events) {
    // include URL host in key to avoid cross-provider collisions on generic titles
    const host = (() => {
      try { return e.url ? new URL(e.url).host : ""; } catch { return ""; }
    })();
    const key = `${(e.title || "").toLowerCase()}|${e.startsAt || ""}|${(e.venue || "").toLowerCase()}|${host}`;
    if (!seen.has(key)) seen.set(key, e);
  }
  return [...seen.values()];
}

// Optional: convert your extracted "time_window" into SerpAPI `when`
function serpWhenFromIntent(tw?: string): string | undefined {
  switch ((tw || "").toLowerCase()) {
    case "today": return "today";
    case "tonight": return "today"; // SerpAPI doesn't have "tonight"; "today" is closest
    case "tomorrow": return "tomorrow";
    case "weekend": return "this weekend";
    default: return undefined;
  }
}

export async function POST(req: Request) {
  try {
    const { prompt, city, country } = await req.json();

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: "API configuration error: GROQ_API_KEY not set" }, { status: 500 });
    }
    if (!process.env.TICKETMASTER_API_KEY) {
      return NextResponse.json({ error: "API configuration error: TICKETMASTER_API_KEY not set" }, { status: 500 });
    }

    // optional, only needed if you want server-side geocoding for Serp results missing lat/lng
    const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

    // 1) Intent (keywords / time window / possible city,country overrides)
    const intent = await extractIntent(prompt ?? "", city, country);

    const keywords = Array.isArray(intent.topic_keywords) ? intent.topic_keywords : [];
    const keyword = (keywords.join(" ").trim() || prompt || "").slice(0, 100);

    const serpWhen = serpWhenFromIntent(String(intent.time_window));
    const finalCity = typeof intent.city === "string" ? intent.city : city;
    const finalCountry = typeof intent.country === "string" ? intent.country : country;

    // 2) Providers in parallel: Ticketmaster + SerpAPI (Google Events)
    const tmP = fetchTicketmaster({
      keyword,
      city: finalCity,
      countryCode: finalCountry,
    });

    const serpP = process.env.SERPAPI_API_KEY
      ? fetchSerpEvents({
          q: keyword,
          city: finalCity,
          country: finalCountry,
          when: serpWhen,
          limit: 80,                // tweakable
          mapboxToken: MAPBOX_TOKEN // for forward geocoding when coords missing
        })
      : Promise.resolve<NormalizedEvent[]>([]);

    const [tm, serp] = await Promise.all([tmP, serpP]);

    // 3) Merge, dedupe, sort, limit
    const merged = dedupe([...tm, ...serp])
      .sort((a, b) => (a.startsAt || "").localeCompare(b.startsAt || ""))
      .slice(0, 120);

    return NextResponse.json({ intent, events: merged });
  } catch (error) {
    console.error("Events API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch events", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
