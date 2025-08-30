import { NextResponse } from "next/server";
import type { NormalizedEvent } from "@/lib/types";
import { extractIntent } from "../providers/groq-intent";
import { fetchTicketmaster } from "../providers/ticketmaster";
import { fetchEventbriteSearch, fetchEventbriteOrgEvents } from "../providers/eventbrite";

function dedupe(events: NormalizedEvent[]) {
  const seen = new Map<string, NormalizedEvent>();
  for (const e of events) {
    const key = `${(e.title || "").toLowerCase()}|${e.startsAt || ""}|${(e.venue || "").toLowerCase()}`;
    if (!seen.has(key)) seen.set(key, e);
  }
  return [...seen.values()];
}

// optional: simple time window → range start/end
function timeRangeFromWindow(tw: string | undefined) {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  switch (tw) {
    case "today":
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "tonight":
      start.setHours(17, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "tomorrow":
      start.setDate(start.getDate() + 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() + 1);
      end.setHours(23, 59, 59, 999);
      break;
    case "weekend": {
      const day = now.getDay(); // 0 Sun ... 6 Sat
      const daysUntilSat = (6 - day + 7) % 7;
      const saturday = new Date(now);
      saturday.setDate(now.getDate() + daysUntilSat);
      saturday.setHours(0, 0, 0, 0);
      const sunday = new Date(saturday);
      sunday.setDate(saturday.getDate() + 1);
      sunday.setHours(23, 59, 59, 999);
      return {
        rangeStartISO: saturday.toISOString(),
        rangeEndISO: sunday.toISOString(),
      };
    }
    default:
      return {};
  }

  return {
    rangeStartISO: start.toISOString(),
    rangeEndISO: end.toISOString(),
  };
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

               const keywords = Array.isArray(intent.topic_keywords) ? intent.topic_keywords : [];
           const keyword = (keywords.join(" ").trim() || prompt || "").slice(0, 100); // keep it tidy
           console.log('Searching with keyword:', keyword);

           const timeRange = timeRangeFromWindow(String(intent.time_window));

           // Fire all providers
           console.log('Fetching from Ticketmaster...');
           const tmP = fetchTicketmaster({
             keyword,
             city: typeof intent.city === "string" ? intent.city : undefined,
             countryCode: typeof intent.country === "string" ? intent.country : undefined,
           });

           console.log('Fetching from Eventbrite search...');
           const ebSearchP = process.env.EVENTBRITE_TOKEN
             ? fetchEventbriteSearch({
                 q: keyword,
                 city: typeof intent.city === "string" ? intent.city : undefined,
                 country: typeof intent.country === "string" ? intent.country : undefined,
                 within: "30mi",
                 rangeStartISO: timeRange.rangeStartISO,
                 rangeEndISO: timeRange.rangeEndISO,
                 maxPages: 2,
               })
             : Promise.resolve<NormalizedEvent[]>([]);

           console.log('Fetching from Eventbrite org...');
           const ebOrgP = process.env.EVENTBRITE_ORG_ID && process.env.EVENTBRITE_TOKEN
             ? fetchEventbriteOrgEvents({ orgId: process.env.EVENTBRITE_ORG_ID })
             : Promise.resolve<NormalizedEvent[]>([]);

           const [tm, ebSearch, ebOrg] = await Promise.all([tmP, ebSearchP, ebOrgP]);
           console.log('Results:', { 
             ticketmaster: tm.length, 
             eventbriteSearch: ebSearch.length, 
             eventbriteOrg: ebOrg.length 
           });

           // 3) Merge, dedupe, sort by date, and limit to 100 events
           const merged = dedupe([...tm, ...ebSearch, ...ebOrg])
             .sort((a, b) => (a.startsAt || "").localeCompare(b.startsAt || ""))
             .slice(0, 100); // Increased limit since we have more sources

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
