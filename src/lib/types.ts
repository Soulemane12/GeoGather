export type Intent = {
  topic_keywords: string[];     // ["jazz","live music"]
  time_window: "today" | "tonight" | "tomorrow" | "weekend" | "any";
  city?: string;                // e.g., "Boston"
  country?: string;             // e.g., "US"
};

export type NormalizedEvent = {
  id: string;
  source: "ticketmaster" | "serpapi";
  title: string;
  startsAt?: string;
  venue?: string;
  city?: string;
  lat?: number;
  lng?: number;
  url: string;
  description?: string;
};
