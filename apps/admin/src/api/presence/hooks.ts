import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getPresence,
  leavePresence,
  leavePresenceOnClose,
  reportPresence,
} from "./requests";
import { PresencePart, PresenceResource } from "./types";

/** Sent again this often when nothing changes; the backend waits 2.5 minutes. */
const HEARTBEAT_MS = 30_000;
/** How often a page asks who else is on it. */
const POLL_MS = 5_000;

const randomId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

// One per loaded page rather than per tab in sessionStorage, which a
// duplicated tab copies: two tabs with one id would hide each other.
const CLIENT_ID = randomId();

/**
 * Tells the backend that this tab is on the map's or group's page and which
 * parts of it have unsaved changes (at once when that changes, otherwise as a
 * heartbeat), and asks every few seconds who else is on the page and what
 * version its tree has now. The asking pauses while the tab is hidden; the
 * telling doesn't, so unsaved changes in a hidden tab still count.
 */
export function usePresence(
  resource: PresenceResource | null,
  dirty: PresencePart[],
) {
  const type = resource?.type;
  const id = resource?.id;
  const dirtyKey = [...dirty].sort().join(",");

  useEffect(() => {
    if (!type || !id) return;
    const parts = dirtyKey ? (dirtyKey.split(",") as PresencePart[]) : [];
    const report = () => {
      reportPresence({ type, id }, CLIENT_ID, parts).catch(() => undefined);
    };
    report();
    const timer = window.setInterval(report, HEARTBEAT_MS);
    return () => window.clearInterval(timer);
  }, [type, id, dirtyKey]);

  // Leaving the page, or closing the tab, takes it off at once. The leave is
  // for this page only, so it can't undo the report from the next one.
  useEffect(() => {
    if (!type || !id) return;
    const onPageHide = () => leavePresenceOnClose({ type, id }, CLIENT_ID);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      leavePresence({ type, id }, CLIENT_ID).catch(() => undefined);
    };
  }, [type, id]);

  return useQuery({
    queryKey: ["presence", type, id],
    queryFn: () => getPresence({ type: type!, id: id! }, CLIENT_ID),
    enabled: Boolean(type && id),
    refetchInterval: POLL_MS,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
}
