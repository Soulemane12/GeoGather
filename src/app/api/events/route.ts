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

function getPlanLimits(plan: string) {
  switch (plan) {
    case 'premium':
      return { radiusMiles: null, maxEvents: null }; // unlimited
    case 'pro':
      return { radiusMiles: 25, maxEvents: 200 };
    case 'free':
    default:
      return { radiusMiles: 5, maxEvents: 50 };
  }
}



export async function POST(req: Request) {
  try {
    const { prompt, city, country, plan = 'free' } = await req.json();

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

    // Get plan limits
    const planLimits = getPlanLimits(plan);

    const tmP = fetchTicketmaster({
      keyword,
      city: finalCity,
      countryCode: finalCountry,
      size: planLimits.maxEvents ? Math.min(150, planLimits.maxEvents * 2) : 150,
      maxPages: 3,
    });

    const serpP = fetchSerpEvents({
      q: keyword,
      city: finalCity,
      country: finalCountry,
      when: serpWhen,
      limit: planLimits.maxEvents ? Math.min(100, planLimits.maxEvents) : 100,
      mapboxToken: MAPBOX_TOKEN,
    });

    const [tm, serp] = await Promise.all([tmP, serpP]);

    let merged = dedupe([...tm, ...serp])
      .sort((a, b) => (a.startsAt || "").localeCompare(b.startsAt || ""));

    // Apply plan-based limits
    if (planLimits.maxEvents) {
      merged = merged.slice(0, planLimits.maxEvents);
    }

    // Apply radius filtering if needed
    if (planLimits.radiusMiles && merged.length > 0) {
      // For radius filtering, we need the user's location
      // Since we don't have exact coordinates, we'll filter based on city proximity
      // This is a simplified approach - in production, you'd want exact coordinates
      const cityEvents = merged.filter(event => {
        const eventCity = event.city?.toLowerCase();
        const searchCity = finalCity?.toLowerCase();
        return eventCity === searchCity || !searchCity;
      });

      // If we have too few events after city filtering, include some nearby
      if (cityEvents.length < merged.length * 0.5) {
        merged = cityEvents;
      }
    }

    return NextResponse.json({
      intent,
      events: merged,
      plan: planLimits,
      totalEvents: merged.length
    });
  } catch (error) {
    console.error("Events API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch events", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
