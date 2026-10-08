"use client";

type Signal =
  | "boot_complete"
  | "age_accepted"
  | "enter_stream"
  | "play"
  | "next"
  | "queue_next"
  | "magazine_open"
  | "writing_open"
  | "category_filter"
  | "command"
  | "footprint_open"
  | "cosmogram_view";

type AnalyticsEvent = {
  signal: Signal;
  at: number;
  meta?: Record<string, string | number | boolean>;
};

const KEY = "kn.analytics.v1";
const MAX = 80;

function read(): AnalyticsEvent[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AnalyticsEvent[];
    return Array.isArray(parsed) ? parsed.slice(-MAX) : [];
  } catch {
    return [];
  }
}

function write(events: AnalyticsEvent[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(events.slice(-MAX)));
  } catch {
    /* private mode */
  }
}

/** First-party bounce/engagement signals — no third-party trackers. */
export function track(signal: Signal, meta?: AnalyticsEvent["meta"]) {
  if (typeof window === "undefined") return;
  const events = read();
  events.push({ signal, at: Date.now(), meta });
  write(events);
  // Best-effort beacon for the owner analytics tab (ignore network failures).
  try {
    void fetch("/api/analytics", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ signal, meta }),
      keepalive: true,
    });
  } catch {
    /* offline / private */
  }
}

export function engagementSummary() {
  const events = read();
  const signals = new Set(events.map((e) => e.signal));
  return {
    count: events.length,
    hasPlay: signals.has("play") || signals.has("enter_stream"),
    hasWriting: signals.has("writing_open"),
    /** @deprecated MagCloud path retired — alias of hasWriting */
    hasMagazine: signals.has("writing_open") || signals.has("magazine_open"),
    hasDepth: signals.has("footprint_open") || signals.has("category_filter"),
    lowBounce:
      signals.has("enter_stream") ||
      signals.has("play") ||
      signals.has("writing_open"),
  };
}
