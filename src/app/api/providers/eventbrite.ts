import type { NormalizedEvent } from "@/lib/types";

const EB_BASE = "https://www.eventbriteapi.com/v3";

export async function fetchEventbriteOrgEvents(opts: {
  orgId: string; status?: "live" | "started" | "ended" | "canceled";
  maxPages?: number;
}): Promise<NormalizedEvent[]> {
  const token = process.env.EVENTBRITE_TOKEN!;
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
      const v = ev.venue;
      out.push({
        id: ev.id,
        source: "eventbrite",
        title: ev.name?.text ?? "Untitled",
        startsAt: ev.start?.utc ?? ev.start?.local,
        venue: v?.name,
        city: v?.address?.city,
        lat: v?.address?.latitude ? parseFloat(v.address.latitude) : undefined,
        lng: v?.address?.longitude ? parseFloat(v.address.longitude) : undefined,
        url: ev.url,
        description: ev.description?.text ?? undefined,
      });
    }

    if (!json?.pagination?.has_more_items) break;
    page = (json.pagination.page_number ?? page) + 1;
  }

  return out;
}
