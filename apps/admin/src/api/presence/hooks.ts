import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getPresence,
  leavePresence,
  leavePresenceOnClose,
  reportPresence,
} from "./requests";
import { LayerTreeShadow, PresenceResource } from "./types";

/** Sent again this often when nothing changes; the backend waits 2.5 minutes. */
const HEARTBEAT_MS = 30_000;
/** How often a page asks who else is on it. */
const POLL_MS = 5_000;
/** A pause in the editing first, so typing a name doesn't send every key. */
const REPORT_DELAY_MS = 500;

const randomId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

// One per loaded page rather than per tab in sessionStorage, which a
// duplicated tab copies: two tabs with one id would hide each other.
const CLIENT_ID = randomId();

/**
 * Tells the backend that this tab is on the map's or group's page and what
 * its unsaved draft of the tree is, if any (soon after it changes, at once
 * when it is gone, otherwise as a heartbeat), and asks every few seconds who
 * else is editing the tree.
 * The asking pauses while the tab is hidden; the telling doesn't, so unsaved
 * changes in a hidden tab still count. `shadow` must keep its identity while
 * the draft stays the same.
 */
export function usePresence(
  resource: PresenceResource | null,
  shadow: LayerTreeShadow | null,
) {
  const type = resource?.type;
  const id = resource?.id;

  useEffect(() => {
    if (!type || !id) return;
    const report = () => {
      reportPresence({ type, id }, CLIENT_ID, shadow).catch(() => undefined);
    };
    // Stopping, as when the draft has been saved, is told at once, so that
    // others don't see the tab still editing beside its save.
    let soon: number | undefined;
    if (shadow === null) report();
    else soon = window.setTimeout(report, REPORT_DELAY_MS);
    const timer = window.setInterval(report, HEARTBEAT_MS);
    return () => {
      window.clearTimeout(soon);
      window.clearInterval(timer);
    };
  }, [type, id, shadow]);

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
