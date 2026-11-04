/**
 * Whether a map's, a layer's or a service's users get it: its `visible`
 * option and the optional period from `visibleFrom` to `visibleUntil`. A
 * layer also needs its service. The backend applies the same rule
 * (utils/availability.ts) when the client fetches a map.
 */
export interface Availability {
  visible: boolean;
  from: Date | null;
  until: Date | null;
}

export type AvailabilityState =
  | { kind: "shown"; until: Date | null }
  | { kind: "hidden" }
  | { kind: "notYet"; from: Date }
  | { kind: "ended"; until: Date };

function dateOf(value: unknown): Date | null {
  if (typeof value !== "string" || value === "") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** From saved options ("false", ISO date-times) or a form's values (a boolean, datetime-local values). */
export function availabilityOf(
  options: Record<string, unknown> | undefined,
): Availability {
  return {
    visible: options?.visible !== false && options?.visible !== "false",
    from: dateOf(options?.visibleFrom),
    until: dateOf(options?.visibleUntil),
  };
}

export function availabilityState(
  { visible, from, until }: Availability,
  now: Date = new Date(),
): AvailabilityState {
  if (!visible) return { kind: "hidden" };
  if (from && now < from) return { kind: "notYet", from };
  if (until && now >= until) return { kind: "ended", until };
  return { kind: "shown", until };
}

/** Whether users get it now, from saved options. */
export function isAvailableNow(
  options: Record<string, unknown> | undefined,
  now: Date = new Date(),
): boolean {
  return availabilityState(availabilityOf(options), now).kind === "shown";
}

/** A list's availability filter: all, the available or the unavailable. */
export type AvailabilityFilter = "" | "available" | "unavailable";

export function hasValidPeriod({ from, until }: Availability): boolean {
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
