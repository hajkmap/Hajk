import { getApiClient } from "../../lib/internal-api-client";
import useAppStateStore from "../../store/use-app-state-store";
import { LayerTreeShadow, Presence, PresenceResource } from "./types";

/**
 * Presence on map and group pages: GET/POST /presence and POST
 * /presence/leave. Only a warning to others, so a report that fails is not
 * worth telling the user about; the callers ignore it.
 */

const tabQuery = (resource: PresenceResource, clientId: string) =>
  new URLSearchParams({
    clientId,
    type: resource.type,
    id: resource.id,
  }).toString();

export const getPresence = async (
  resource: PresenceResource,
  clientId: string,
): Promise<Presence> => {
  const response = await getApiClient().get<Presence>(
    `/presence?${tabQuery(resource, clientId)}`,
  );
  return response.data;
};

/** The backend takes 100 kB a request; a bigger draft is sent without it. */
const MAX_SHADOW_BYTES = 90_000;

const fits = (shadow: LayerTreeShadow) =>
  new TextEncoder().encode(JSON.stringify(shadow)).length <= MAX_SHADOW_BYTES;

/** `shadow` is the tab's draft of the tree, null when it has none. */
export const reportPresence = async (
  resource: PresenceResource,
  clientId: string,
  shadow: LayerTreeShadow | null,
) => {
  await getApiClient().post("/presence", {
    clientId,
    type: resource.type,
    id: resource.id,
    editing: shadow !== null,
    shadow: shadow && fits(shadow) ? shadow : null,
  });
};

export const leavePresence = async (
  resource: PresenceResource,
  clientId: string,
) => {
  await getApiClient().post(`/presence/leave?${tabQuery(resource, clientId)}`);
};

/** As leavePresence, for a tab that is closing: a beacon outlives the page. */
export const leavePresenceOnClose = (
  resource: PresenceResource,
  clientId: string,
) => {
  const base = useAppStateStore.getState().apiBaseUrl.replace(/\/+$/, "");
  if (!base || typeof navigator.sendBeacon !== "function") return;
  navigator.sendBeacon(
    `${base}/presence/leave?${tabQuery(resource, clientId)}`,
  );
};
