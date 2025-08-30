import { NextResponse } from "next/server";
import type { NormalizedEvent } from "@/lib/types";
import { extractIntent } from "../providers/groq-intent";
import { fetchTicketmaster } from "../providers/ticketmaster";
import { fetchSerpEvents } from "../providers/serp";

function dedupe(events: NormalizedEvent[]) {
  const seen = new Map<string, NormalizedEvent>();
  for (const e of events) {
    const key = `${(e.title || "").toLowerCase()}|${e.startsAt || ""}|${(e.venue || "").toLowerCase()}`;
    if (!seen.has(key)) seen.set(key, e);
  }
  return [...seen.values()];
}



export async function POST(req: Request) {
  try {
    const { prompt, city, country } = await req.json();
    
    console.log('Events API called with:', { prompt, city, country });

    // Check if required environment variables are set
    if (!process.env.GROQ_API_KEY) {
      console.error('GROQ_API_KEY not set');
      return NextResponse.json(
        { error: 'API configuration error: GROQ_API_KEY not set' },
        { status: 500 }
      );
    }

    if (!process.env.TICKETMASTER_API_KEY) {
      console.error('TICKETMASTER_API_KEY not set');
      return NextResponse.json(
        { error: 'API configuration error: TICKETMASTER_API_KEY not set' },
        { status: 500 }
      );
    }

    if (!process.env.SERPAPI_API_KEY) {
      console.error('SERPAPI_API_KEY not set');
      return NextResponse.json(
        { error: 'API configuration error: SERPAPI_API_KEY not set' },
        { status: 500 }
      );
    }

    // 1) Ask Groq to extract intent (keywords/time, and maybe city/country if user typed them)
    console.log('Calling Groq intent extraction...');
    const intent = await extractIntent(prompt ?? "", city, country);
    console.log('Groq intent result:', intent);

    const keywords = Array.isArray(intent.topic_keywords) ? intent.topic_keywords : [];
    const keyword = (keywords.join(" ").trim() || prompt || "").slice(0, 100); // keep it tidy
    console.log('Searching with keyword:', keyword);

    // Convert time window to Serp API format
    const serpWhen = (() => {
      switch (intent.time_window) {
        case "today": return "today";
        case "tonight": return "today";
        case "tomorrow": return "tomorrow";
        case "weekend": return "this weekend";
        default: return undefined;
      }
    })();

    // Fire all providers
    console.log('Fetching from Ticketmaster...');
    const tmP = fetchTicketmaster({
      keyword,
      city: typeof intent.city === "string" ? intent.city : undefined,
      countryCode: typeof intent.country === "string" ? intent.country : undefined,
    });

    console.log('Fetching from Serp API...');
    const serpP = fetchSerpEvents({
      q: keyword,
      city: typeof intent.city === "string" ? intent.city : undefined,
      country: typeof intent.country === "string" ? intent.country : undefined,
      when: serpWhen,
      limit: 50,
      mapboxToken: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN,
    });

    const [tm, serp] = await Promise.all([tmP, serpP]);
    console.log('Results:', { 
      ticketmaster: tm.length, 
      serpapi: serp.length
    });

    // 3) Merge, dedupe, sort by date, and limit to 100 events
    const merged = dedupe([...tm, ...serp])
      .sort((a, b) => (a.startsAt || "").localeCompare(b.startsAt || ""))
      .slice(0, 100);

    console.log('Final merged results:', merged.length);
    return NextResponse.json({
      intent,
      events: merged,
    });
  } catch (error) {
    console.error('Events API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch events', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
