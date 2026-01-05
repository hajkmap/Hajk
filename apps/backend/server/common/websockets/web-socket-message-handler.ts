import log4js from "../utils/hajk-logger.js";
import { type CustomWebSocket, type HajkSocketMessage } from "./index.ts";
import adminPresenceService from "./admin-presence-service.ts";

// These shouldn't probably be handled here, but these imports
// are just for the sake of the example.
import layerService from "../../apis/v3/services/layer.service.ts";
import mapService from "../../apis/v3/services/map.service.ts";

const logger = log4js.getLogger("websockets");

// Extended message types for presence
interface PresenceUpdateMessage extends HajkSocketMessage {
  type: "presence-update";
  payload: {
    resourceType: "map" | "layer" | "tool" | "group" | "service";
    resourceId: string;
  };
}

interface PresenceLeaveMessage extends HajkSocketMessage {
  type: "presence-leave";
}

interface RegisterMessage extends HajkSocketMessage {
  type: "register";
  payload: {
    userId: string;
    userName: string;
  };
}

type ExtendedHajkSocketMessage =
  | HajkSocketMessage
  | PresenceUpdateMessage
  | PresenceLeaveMessage
  | RegisterMessage;

class WebSocketMessageHandler {
  // This is the only public method. See it as an entry point
  // to this message handler.
  handleMessage(
    websocketConnection: CustomWebSocket,
    parsedMessage: ExtendedHajkSocketMessage
  ) {
    // A little helper to handle unsupported message types and their logging
    const handleUnsupportedType = (type: string) => {
      const msg = `No message handler for type "${type}". Will not process further.`;
      logger.trace(msg);
      websocketConnection.send(JSON.stringify({ type: "error", payload: msg }));
    };

    // Use switch instead of Map to properly call private methods
    switch (parsedMessage.type) {
      case "getLayers":
        this.#handleGetLayers(websocketConnection, parsedMessage);
        break;
      case "getMaps":
        this.#handleGetMaps(websocketConnection, parsedMessage);
        break;
      case "register":
        this.#handleRegister(websocketConnection, parsedMessage);
        break;
      case "presence-update":
        this.#handlePresenceUpdate(websocketConnection, parsedMessage);
        break;
      case "presence-leave":
        this.#handlePresenceLeave(websocketConnection, parsedMessage);
        break;
      default:
        handleUnsupportedType(parsedMessage.type);
    }
  }

  /**
   * Handle connection unregister (called from index.ts on close)
   */
  handleDisconnect(connectionId: string) {
    adminPresenceService.unregisterConnection(connectionId);
  }

  // And here are our message handlers that actually get the job done.
  // This could be further restructured, logic can be lifted and implemented
  // in classes outside this file, etc. This is just a stub.
  async #handleGetMaps(ws: CustomWebSocket, m: HajkSocketMessage) {
    logger.trace(
      `Processing request for "${m.type}" from client "${ws.uuid}".`
    );
    const maps = await mapService.getMapNames();
    ws.send(JSON.stringify({ type: "maps", payload: maps }));
  }

  async #handleGetLayers(ws: CustomWebSocket, m: HajkSocketMessage) {
    logger.trace(
      `Processing request for "${m.type}" from client "${ws.uuid}".`
    );
    const l = await layerService.getLayers();
    ws.send(JSON.stringify({ type: "layers", payload: l }));
  }

  /**
   * Register a connection with user info
   */
  #handleRegister(ws: CustomWebSocket, m: ExtendedHajkSocketMessage) {
    if (m.type !== "register") return;

    const { userId, userName } = (m as RegisterMessage).payload;
    logger.trace(
      `Registering connection ${ws.uuid} for user ${userName} (${userId})`
    );

    adminPresenceService.registerConnection(ws, userId, userName);

    // Confirm registration
    ws.send(
      JSON.stringify({
        type: "registered",
        payload: { connectionId: ws.uuid },
      })
    );
  }

  /**
   * Handle presence update (user started editing a resource)
   */
  #handlePresenceUpdate(ws: CustomWebSocket, m: ExtendedHajkSocketMessage) {
    if (m.type !== "presence-update") return;

    const { resourceType, resourceId } = (m as PresenceUpdateMessage).payload;
    logger.trace(
      `Presence update from ${ws.uuid}: ${resourceType}:${resourceId}`
    );

    adminPresenceService.updatePresence(ws.uuid, resourceType, resourceId);
  }

  /**
   * Handle presence leave (user stopped editing a resource)
   */
  #handlePresenceLeave(ws: CustomWebSocket, m: ExtendedHajkSocketMessage) {
    if (m.type !== "presence-leave") return;

    logger.trace(`Presence leave from ${ws.uuid}`);
    adminPresenceService.clearPresence(ws.uuid);
  }
}

export default new WebSocketMessageHandler();
