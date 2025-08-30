import type { NormalizedEvent } from "@/lib/types";

const EB_BASE = "https://www.eventbriteapi.com/v3";

function parseLatLng(v: { address?: { latitude?: string; longitude?: string }; latitude?: string; longitude?: string } | null | undefined) {
  const latStr = v?.address?.latitude ?? v?.latitude;
  const lngStr = v?.address?.longitude ?? v?.longitude;
  return {
    lat: latStr ? parseFloat(latStr) : undefined,
    lng: lngStr ? parseFloat(lngStr) : undefined,
  };
}

/**
 * Search public Eventbrite events by keyword + location address.
 * NOTE: Eventbrite discovery/search has been flaky for some accounts.
 * If it returns few/no events, keep the org-based fetch as a fallback.
 */
export async function fetchEventbriteSearch(opts: {
  q: string;
  city?: string;
  country?: string;      // e.g. "US"
  within?: string;       // e.g. "25mi" or "40km"
  rangeStartISO?: string; // optional date filter start
  rangeEndISO?: string;   // optional date filter end
  maxPages?: number;
}): Promise<NormalizedEvent[]> {
  const token = process.env.EVENTBRITE_TOKEN!;
  if (!token) return [];

  const within = opts.within ?? "30mi";
  const maxPages = opts.maxPages ?? 2;

  // Build "location.address" like "Brooklyn, US"
  const address =
    [opts.city, opts.country].filter(Boolean).join(", ") || undefined;

  const out: NormalizedEvent[] = [];
  let page = 1;

  while (page <= maxPages) {
    const url = new URL(`${EB_BASE}/events/search/`);
    if (opts.q) url.searchParams.set("q", opts.q);
    if (address) {
      url.searchParams.set("location.address", address);
      url.searchParams.set("location.within", within);
    }
    if (opts.rangeStartISO) {
      url.searchParams.set("start_date.range_start", opts.rangeStartISO);
    }
    if (opts.rangeEndISO) {
      url.searchParams.set("start_date.range_end", opts.rangeEndISO);
    }
    url.searchParams.set("sort_by", "date");
    url.searchParams.set("expand", "venue");
    url.searchParams.set("page", String(page));

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
      // Important for Next.js Edge runtimes: Eventbrite rejects non-https referers sometimes;
      // the Authorization header is all that's required.
    });

    // Gracefully handle Discovery API not available
    if (res.status === 404 || res.status === 403) {
      console.warn("Eventbrite Discovery API not available for this token/account.");
      return []; // silently fallback to org events in the route
    }
    if (!res.ok) break;
    
    const json = await res.json();

    for (const ev of json.events ?? []) {
      const v = ev.venue;
      const { lat, lng } = parseLatLng(v);

      out.push({
        id: ev.id,
        source: "eventbrite",
        title: ev.name?.text ?? "Untitled",
        startsAt: ev.start?.utc ?? ev.start?.local,
        venue: v?.name,
        city: v?.address?.city,
        lat,
        lng,
        url: ev.url,
        description: ev.description?.text ?? undefined,
      });
    }

    // paging
    if (!json?.pagination?.has_more_items) break;
    page = (json.pagination.page_number ?? page) + 1;
  }

  return out;
}

/**
 * Fetch events from a specific Eventbrite organization
 */
export async function fetchEventbriteOrgEvents(opts: {
  orgId: string; status?: "live" | "started" | "ended" | "canceled";
  maxPages?: number;
}): Promise<NormalizedEvent[]> {
  const token = process.env.EVENTBRITE_TOKEN!;
  if (!token || !opts.orgId) return [];

  const status = opts.status ?? "live";
  const maxPages = opts.maxPages ?? 2;
  const out: NormalizedEvent[] = [];
  let page = 1;

  while (page <= maxPages) {
    const url = new URL(`${EB_BASE}/organizations/${opts.orgId}/events/`);
    url.searchParams.set("status", status);
    url.searchParams.set("order_by", "start_asc");
    url.searchParams.set("expand", "venue");     // include lat/lng
    url.searchParams.set("page", String(page));

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) break;
    const json = await res.json();

    for (const ev of json.events ?? []) {
      const v = ev.venue ?? {};
      const { lat, lng } = parseLatLng(v);
      
      out.push({
        id: ev.id,
        source: "eventbrite",
        title: ev.name?.text ?? "Untitled",
        startsAt: ev.start?.utc ?? ev.start?.local,
        venue: v?.name,
        city: v?.address?.city,
        lat,
        lng,
        url: ev.url,
        description: ev.description?.text ?? undefined,
      });
    }

    if (!json?.pagination?.has_more_items) break;
    page = (json.pagination.page_number ?? page) + 1;
  }

  return out;
}

/**
 * Auto-detect your organizations from the token and aggregate events from all of them.
 * Works even if you don't set EVENTBRITE_ORG_ID.
 */
export async function fetchEventbriteOrgEventsAuto(opts?: {
  status?: "live" | "started" | "ended" | "canceled";
  maxPages?: number;
}): Promise<NormalizedEvent[]> {
  const token = process.env.EVENTBRITE_TOKEN!;
  if (!token) return [];

  const orgRes = await fetch(`${EB_BASE}/users/me/organizations/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!orgRes.ok) {
    console.warn("Eventbrite: unable to list organizations (check token scopes)");
    return [];
  }
  const orgJson = await orgRes.json();
  const orgs: Array<{ id: string }> = orgJson?.organizations ?? [];
  if (orgs.length === 0) return [];

  const all: NormalizedEvent[] = [];
  for (const org of orgs) {
    const evs = await fetchEventbriteOrgEvents({
      orgId: org.id,
      status: opts?.status,
      maxPages: opts?.maxPages,
    });
    all.push(...evs);
  }
  return all;
}
