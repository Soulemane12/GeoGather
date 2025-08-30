import type { NormalizedEvent } from "@/lib/types";

const TM_BASE = "https://app.ticketmaster.com/discovery/v2";

type TMEvent = {
  id: string; name: string; url: string; info?: string;
  dates?: { start?: { dateTime?: string; localDate?: string } };
  _embedded?: { venues?: Array<{
    name?: string; city?: { name?: string };
    location?: { latitude?: string; longitude?: string };
  }>};
};

function tmDateSort(a?: string, b?: string) {
  return (a || "").localeCompare(b || "");
}

export async function fetchTicketmaster(opts: {
  keyword: string; city?: string; countryCode?: string;
  size?: number; maxPages?: number;
}): Promise<NormalizedEvent[]> {
  const key = process.env.TICKETMASTER_API_KEY!;
  const size = opts.size ?? 100;
  const maxPages = opts.maxPages ?? 2;

  const out: NormalizedEvent[] = [];
  for (let page = 0; page < maxPages; page++) {
    const url = new URL(`${TM_BASE}/events.json`);
    url.searchParams.set("apikey", key);                      // auth
    url.searchParams.set("keyword", opts.keyword);            // query
    if (opts.city) url.searchParams.set("city", opts.city);
    if (opts.countryCode) url.searchParams.set("countryCode", opts.countryCode);
    url.searchParams.set("size", String(size));
    url.searchParams.set("page", String(page));
    url.searchParams.set("sort", "date,asc");

    const res = await fetch(url.toString());
    if (!res.ok) break;
    const json = await res.json();

    const events: TMEvent[] = json?._embedded?.events ?? [];
    for (const ev of events) {
      const v = ev._embedded?.venues?.[0];
      out.push({
        id: ev.id,
        source: "ticketmaster",
        title: ev.name,
        startsAt: ev.dates?.start?.dateTime ?? ev.dates?.start?.localDate,
        venue: v?.name,
        city: v?.city?.name,
        lat: v?.location?.latitude ? parseFloat(v.location.latitude) : undefined,
        lng: v?.location?.longitude ? parseFloat(v.location.longitude) : undefined,
        url: ev.url,
        description: ev.info,
      });
    }

    // stop if last page
    const p = json?.page;
    if (!p || p.number >= (p.totalPages ?? 1) - 1) break;
  }
  // ensure deterministic order
  return out.sort((a, b) => tmDateSort(a.startsAt, b.startsAt));
}
