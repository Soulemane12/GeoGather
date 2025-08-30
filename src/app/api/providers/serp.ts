import type { NormalizedEvent } from "@/lib/types";

/** Mapbox forward geocode (best-effort) */
async function geocodeAddress(address: string, mapboxToken?: string) {
  try {
    if (!mapboxToken) return {};
    const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json`);
    url.searchParams.set("access_token", mapboxToken);
    url.searchParams.set("limit", "1");
    url.searchParams.set("language", "en");
    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) return {};
    const json = await res.json();
    const c = json?.features?.[0]?.center;
    if (Array.isArray(c) && c.length === 2) return { lng: Number(c[0]), lat: Number(c[1]) };
  } catch {}
  return {};
}

/** Groq: extract events from raw HTML */
async function extractEventsFromHtml(html: string, pageUrl: string, cityHint?: string) {
  try {
    const apiKey = process.env.GROQ_API_KEY!;
    if (!apiKey) return [];
    const truncated = html.slice(0, 16000); // keep tokens sane

    const body = {
      model: "llama-3.1-70b-versatile",
      temperature: 0.1,
      response_format: { type: "json_object" as const },
      messages: [
        {
          role: "system",
          content:
            "You are an extraction API. From HTML, extract a list of real-world event objects. Return strict JSON with key `events`: [{title, startsAt, venue, address, url}]. Use ISO8601 for startsAt when possible; otherwise omit it. Address may be partial. If nothing, return {\"events\":[]}. Do not invent data.",
        },
        {
          role: "user",
          content:
            `URL: ${pageUrl}\nCity hint: ${cityHint || ""}\nHTML (truncated):\n${truncated}`,
        },
      ],
    };

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) return [];
    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content;
    if (!content) return [];
    const parsed = JSON.parse(content);
    const events = Array.isArray(parsed?.events) ? parsed.events : [];
    return events as Array<{
      title?: string;
      startsAt?: string;
      venue?: string;
      address?: string;
      url?: string;
    }>;
  } catch {
    return [];
  }
}

/**
 * SerpAPI: Google *Search* (engine=google), not google_events.
 * 1) Try the events pack if Google returns it inside this response.
 * 2) Otherwise parse top organic results -> fetch HTML -> Groq-extract events.
 * 3) Geocode missing coords via Mapbox.
 */
export async function fetchSerpEvents(opts: {
  q: string;
  city?: string;
  country?: string; // e.g., "US"
  when?: string;    // free text like "today", "tomorrow", "this weekend", "tonight"
  limit?: number;   // cap
  mapboxToken?: string;
}): Promise<NormalizedEvent[]> {
  const key = process.env.SERPAPI_API_KEY!;
  if (!key) return [];

  const limit = Math.max(1, Math.min(opts.limit ?? 100, 150));
  const location = opts.city || opts.country || undefined;

  // Build a search query for Google Events
  const whenText = opts.when ? ` ${opts.when}` : "";
  const q = `${opts.q || ""}${whenText}`;

  const params = new URLSearchParams({
    engine: "google_events",
    q,
    api_key: key,
    hl: "en",
  });
  if (location) params.set("location", location);

  const url = `https://serpapi.com/search.json?${params.toString()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return [];

  const data = await res.json();
  const out: NormalizedEvent[] = [];

  // 1) If Google Search response happens to include an events pack, use it directly
  if (Array.isArray(data?.events_results) && data.events_results.length) {
    for (const ev of data.events_results.slice(0, limit)) {
      const title = ev?.title ?? "Untitled";
      const link = ev?.link ?? ev?.event_site ?? undefined;
      const venue = ev?.venue?.name || ev?.address || ev?.organizer || undefined;
      const address = typeof ev?.address === "string" ? ev.address
        : Array.isArray(ev?.address) ? ev.address.join(", ") : undefined;

      let startsAt: string | undefined;
      try {
        const sd = ev?.date?.start_date;
        const st = ev?.date?.start_time;
        if (sd && st) startsAt = new Date(`${sd}T${st}`).toISOString();
        else if (sd)   startsAt = new Date(`${sd}T00:00:00`).toISOString();
      } catch {}

      let lat: number | undefined;
      let lng: number | undefined;
      if (ev?.gps_coordinates?.latitude && ev?.gps_coordinates?.longitude) {
        lat = Number(ev.gps_coordinates.latitude);
        lng = Number(ev.gps_coordinates.longitude);
      } else if (address) {
        const geo = await geocodeAddress(address, opts.mapboxToken);
        if (typeof geo.lat === "number" && typeof geo.lng === "number") {
          lat = geo.lat; lng = geo.lng;
        }
      }

      // Filter events to only include those in the specified city
      const eventAddress = Array.isArray(ev?.address) ? ev.address.join(", ") : ev?.address || "";
      const eventCity = ev?.venue?.name ? undefined : opts.city;
      
      // Check if the event is in the specified city or nearby
      const isInCity = !opts.city || 
        eventAddress.toLowerCase().includes(opts.city.toLowerCase()) ||
        (ev?.venue?.name && ev.venue.name.toLowerCase().includes(opts.city.toLowerCase())) ||
        // For NYC area, also include Manhattan events if searching in Brooklyn
        (opts.city?.toLowerCase() === 'brooklyn' && eventAddress.toLowerCase().includes('new york'));

      if (isInCity) {
        out.push({
          id: ev?.event_id || ev?.id || link || title,
          source: "serpapi",
          title,
          startsAt,
          venue,
          city: eventCity,
          lat,
          lng,
          url: link || "",
          description: ev?.description || undefined,
        });
      }
    }
    return out;
  }

  // 2) No events pack -> crawl top organic results and LLM-extract
  const organic = Array.isArray(data?.organic_results) ? data.organic_results : [];
  const candidates = organic
    .filter((r: { link?: string }) => r?.link && typeof r.link === "string")
    .slice(0, 10); // tweak as needed

  for (const r of candidates) {
    try {
      const pageUrl: string = r.link;
      const htmlRes = await fetch(pageUrl, { cache: "no-store" });
      if (!htmlRes.ok) continue;
      const html = await htmlRes.text();

      const extracted = await extractEventsFromHtml(html, pageUrl, opts.city);
      for (const ev of extracted) {
        if (!ev?.title || !ev?.url) continue;

        let lat: number | undefined;
        let lng: number | undefined;
        const addr = ev.address;
        if (addr) {
          const geo = await geocodeAddress(addr, opts.mapboxToken);
          if (typeof geo.lat === "number" && typeof geo.lng === "number") {
            lat = geo.lat; lng = geo.lng;
          }
        }

        // Filter events to only include those in the specified city or nearby
        const eventAddress = ev.address || "";
        const isInCity = !opts.city || 
          eventAddress.toLowerCase().includes(opts.city.toLowerCase()) ||
          (ev.venue && ev.venue.toLowerCase().includes(opts.city.toLowerCase())) ||
          // For NYC area, also include Manhattan events if searching in Brooklyn
          (opts.city?.toLowerCase() === 'brooklyn' && eventAddress.toLowerCase().includes('new york'));

        if (isInCity) {
          out.push({
            id: ev.url || ev.title,
            source: "serpapi",
            title: ev.title,
            startsAt: ev.startsAt,
            venue: ev.venue,
            city: opts.city,
            lat,
            lng,
            url: ev.url,
            description: undefined,
          });
        }

        if (out.length >= limit) return out;
      }
    } catch { /* ignore this result */ }
  }

  return out;
}
