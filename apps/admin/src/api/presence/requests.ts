import { getApiClient } from "../../lib/internal-api-client";
import useAppStateStore from "../../store/use-app-state-store";
import { Presence, PresencePart, PresenceResource } from "./types";

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

export const reportPresence = async (
  resource: PresenceResource,
  clientId: string,
  dirty: PresencePart[],
) => {
  await getApiClient().post("/presence", {
    clientId,
    type: resource.type,
    id: resource.id,
    dirty,
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
