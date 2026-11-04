/**
 * Whether a map's users see it: its `visible` option and the optional period
 * from `visibleFrom` to `visibleUntil`. The backend applies the same rule
 * (utils/map-visibility.ts) when the client fetches the map.
 */
export interface MapVisibility {
  visible: boolean;
  from: Date | null;
  until: Date | null;
}

export type MapVisibilityState =
  | { kind: "shown"; until: Date | null }
  | { kind: "hidden" }
  | { kind: "notYet"; from: Date }
  | { kind: "ended"; until: Date };

function dateOf(value: unknown): Date | null {
  if (typeof value !== "string" || value === "") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** From saved options ("false", ISO date-times) or the form's values (a boolean, datetime-local values). */
export function mapVisibilityOf(
  options: Record<string, unknown> | undefined,
): MapVisibility {
  return {
    visible: options?.visible !== false && options?.visible !== "false",
    from: dateOf(options?.visibleFrom),
    until: dateOf(options?.visibleUntil),
  };
}

export function mapVisibilityState(
  { visible, from, until }: MapVisibility,
  now: Date = new Date(),
): MapVisibilityState {
  if (!visible) return { kind: "hidden" };
  if (from && now < from) return { kind: "notYet", from };
  if (until && now >= until) return { kind: "ended", until };
  return { kind: "shown", until };
}

export function hasValidPeriod({ from, until }: MapVisibility): boolean {
  return !from || !until || from < until;
}

const pad = (value: number) => String(value).padStart(2, "0");

/** An ISO date-time as a datetime-local field's value, in the browser's time zone. */
export function toDateTimeLocal(value: unknown): string {
  const date = dateOf(value);
  if (!date) return "";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** A datetime-local field's value as an ISO date-time, or "" when it is empty. */
export function fromDateTimeLocal(value: unknown): string {
  return dateOf(value)?.toISOString() ?? "";
}

export function formatWhen(
  date: Date,
  language: string,
  dateStyle: "short" | "medium" = "medium",
): string {
  return new Intl.DateTimeFormat(language, {
    dateStyle,
    timeStyle: "short",
  }).format(date);
}
