import type { NormalizedEvent } from "@/lib/types";

// Forward geocode addresses to lat/lng using Mapbox (best-effort)
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
    if (Array.isArray(c) && c.length === 2) {
      return { lng: Number(c[0]), lat: Number(c[1]) };
    }
  } catch {}
  return {};
}

/**
 * Fetch events using SerpAPI "google_events" engine.
 * Docs: https://serpapi.com/google-events
 */
export async function fetchSerpEvents(opts: {
  q: string;
  city?: string;
  country?: string; // "US", "GB", ...
  when?: string;    // "today" | "tomorrow" | "this weekend" | ...
  limit?: number;   // cap returned items
  mapboxToken?: string; // for geocoding address -> lat/lng
}): Promise<NormalizedEvent[]> {
  const key = process.env.SERPAPI_API_KEY!;
  if (!key) return [];

  const limit = Math.max(1, Math.min(opts.limit ?? 80, 120));
  const location =
    [opts.city, opts.country].filter(Boolean).join(", ") ||
    opts.city ||
    opts.country ||
    undefined;

  const params = new URLSearchParams({
    engine: "google_events",
    q: opts.q || "",
    api_key: key,
    hl: "en",
  });
  if (location) params.set("location", location);
  if (opts.when) params.set("when", opts.when);

  const url = `https://serpapi.com/search.json?${params.toString()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return [];

  const data = await res.json();
  const events = Array.isArray(data?.events_results) ? data.events_results : [];

  const out: NormalizedEvent[] = [];
  for (const ev of events.slice(0, limit)) {
    const title = ev?.title ?? "Untitled";
    const link = ev?.link ?? ev?.event_site ?? undefined;
    const venue = ev?.venue?.name || ev?.address || ev?.organizer || undefined;
    const address = typeof ev?.address === "string" ? ev.address : Array.isArray(ev?.address) ? ev.address.join(", ") : undefined;

    // Try to assemble ISO-ish start time from SerpAPI's date object
    let startsAt: string | undefined;
    try {
      // Common shape: date: { start_date: "2025-09-14", start_time: "19:00", when: "Sun, Sep 14, 7:00 PM" }
      const sd = ev?.date?.start_date;  // "YYYY-MM-DD"
      const st = ev?.date?.start_time;  // "HH:MM"
      if (sd && st) {
        const iso = new Date(`${sd}T${st}`).toISOString();
        startsAt = iso;
      } else if (sd) {
        startsAt = new Date(`${sd}T00:00:00`).toISOString();
      }
    } catch {
      // leave undefined
    }

    // Lat/lng: SerpAPI events usually lack coords. Try mapbox forward geocoding on the address.
    let lat: number | undefined;
    let lng: number | undefined;

    if (ev?.gps_coordinates?.latitude && ev?.gps_coordinates?.longitude) {
      lat = Number(ev.gps_coordinates.latitude);
      lng = Number(ev.gps_coordinates.longitude);
    } else if (address) {
      const geo = await geocodeAddress(address, opts.mapboxToken);
      if (typeof geo.lat === "number" && typeof geo.lng === "number") {
        lat = geo.lat;
        lng = geo.lng;
      }
    }

    out.push({
      id: ev?.event_id || ev?.id || link || title,
      source: "serpapi",
      title,
      startsAt,
      venue,
      city: ev?.venue?.name ? undefined : opts.city, // naive; Google Events doesn't always give city separately
      lat,
      lng,
      url: link,
      description: ev?.description || undefined,
    });
  }

  return out;
}
