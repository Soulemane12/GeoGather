import { NextResponse } from "next/server";
import type { NormalizedEvent } from "@/lib/types";
import { extractIntent } from "../providers/groq-intent";
import { fetchTicketmaster } from "../providers/ticketmaster";
import { fetchEventbriteOrgEvents } from "../providers/eventbrite";

function dedupe(events: NormalizedEvent[]) {
  const seen = new Map<string, NormalizedEvent>();
  for (const e of events) {
    const key = `${(e.title || "").toLowerCase()}|${e.startsAt || ""}|${e.venue || ""}`;
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

    // 1) Ask Groq to extract intent (keywords/time, and maybe city/country if user typed them)
    console.log('Calling Groq intent extraction...');
    const intent = await extractIntent(prompt ?? "", city, country);
    console.log('Groq intent result:', intent);

    // Build a Ticketmaster keyword (join keywords with spaces)
    const topicKeywords = Array.isArray(intent.topic_keywords) ? intent.topic_keywords : [];
    const keyword = topicKeywords.join(" ").trim() || (prompt ?? "");
    console.log('Searching with keyword:', keyword);

    // 2) Fan out to providers
    console.log('Fetching from Ticketmaster...');
    const tmP = fetchTicketmaster({
      keyword,
      city: typeof intent.city === 'string' ? intent.city : undefined,
      countryCode: typeof intent.country === 'string' ? intent.country : undefined,
    });

    const ebP = process.env.EVENTBRITE_ORG_ID
      ? fetchEventbriteOrgEvents({ orgId: process.env.EVENTBRITE_ORG_ID })
      : Promise.resolve<NormalizedEvent[]>([]);

    const [tm, eb] = await Promise.all([tmP, ebP]);
    console.log('Results:', { ticketmaster: tm.length, eventbrite: eb.length });

    // 3) Merge, dedupe, sort by date
    const merged = dedupe([...tm, ...eb]).sort((a, b) =>
      (a.startsAt || "").localeCompare(b.startsAt || "")
    );

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
