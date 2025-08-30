import { NextResponse } from "next/server";
import type { NormalizedEvent } from "@/lib/types";
import { extractIntent } from "../providers/groq-intent";
import { fetchTicketmaster } from "../providers/ticketmaster";
import { fetchSerpEvents } from "../providers/serp";

function dedupe(events: NormalizedEvent[]) {
  const seen = new Map<string, NormalizedEvent>();
  for (const e of events) {
    const host = (() => { try { return e.url ? new URL(e.url).host : ""; } catch { return ""; }})();
    const key = `${(e.title || "").toLowerCase()}|${e.startsAt || ""}|${(e.venue || "").toLowerCase()}|${host}`;
    if (!seen.has(key)) seen.set(key, e);
  }
  return [...seen.values()];
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
    if (!process.env.SERPAPI_API_KEY) {
      return NextResponse.json({ error: "API configuration error: SERPAPI_API_KEY not set" }, { status: 500 });
    }

    const intent = await extractIntent(prompt ?? "", city, country);

    const keywords = Array.isArray(intent.topic_keywords) ? intent.topic_keywords : [];
    const keyword = (keywords.join(" ").trim() || prompt || "").slice(0, 100);

    const serpWhen = (() => {
      switch (intent.time_window) {
        case "today": return "today";
        case "tonight": return "tonight";
        case "tomorrow": return "tomorrow";
        case "weekend": return "this weekend";
        default: return undefined;
      }
    })();

    const finalCity = typeof intent.city === "string" ? intent.city : city;
    const finalCountry = typeof intent.country === "string" ? intent.country : country;

    const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

    const tmP = fetchTicketmaster({
      keyword,
      city: finalCity,
      countryCode: finalCountry,
    });

    const serpP = fetchSerpEvents({
      q: keyword,
      city: finalCity,
      country: finalCountry,
      when: serpWhen,
      limit: 80,
      mapboxToken: MAPBOX_TOKEN,
    });

    const [tm, serp] = await Promise.all([tmP, serpP]);

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
