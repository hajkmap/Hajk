import log4js from "../utils/hajkLogger.js";
import { type CustomWebSocket, type HajkSocketMessage } from "./index.ts";

// These shouldn't probably be handled here, but these imports
// are just for the sake of the example.
import layerService from "../../apis/v3/services/layer.service.ts";
import mapService from "../../apis/v3/services/map.service.ts";

const logger = log4js.getLogger("websockets");

class WebSocketMessageHandler {
  private messageTypeToHandlerMap;

  constructor() {
    // This Map holds valid message type values, i.e. those
    // message types that we can handle, and the corresponding
    // method that should be invoked for each message type.
    this.messageTypeToHandlerMap = new Map([
      ["getLayers", this.#handleGetLayers],
      ["getMaps", this.#handleGetMaps],
    ]);
  }

  // This is the only public method. See it as an entry point
  // to this message handler.
  handleMessage(
    websocketConnection: CustomWebSocket,
    parsedMessage: HajkSocketMessage
  ) {
    // A little helper to handle unsupported message types and their logging
    const handleUnsupportedType = (type: string) => {
      const msg = `No message handler for type "${type}". Will not process further.`;
      logger.trace(msg);
      websocketConnection.send(msg);
    };

    if (this.messageTypeToHandlerMap.has(parsedMessage.type)) {
      const handler = this.messageTypeToHandlerMap.get(parsedMessage.type);
      if (handler) {
        handler(websocketConnection, parsedMessage);
      } else {
        handleUnsupportedType(parsedMessage.type);
      }
    } else {
      handleUnsupportedType(parsedMessage.type);
    }
  }

  // And here are our message handlers that actually get the job done.
  // This could be further restructured, logic can be lifted and implemented
  // in classes outside this file, etc. This is just a stub.
  async #handleGetMaps(ws: CustomWebSocket, m: HajkSocketMessage) {
    logger.trace(
      `Processing request for "${m.type}" from client "${ws.uuid}".`
    );
    const maps = await mapService.getMapNames();
    ws.send(JSON.stringify(maps));
  }

  async #handleGetLayers(ws: CustomWebSocket, m: HajkSocketMessage) {
    logger.trace(
      `Processing request for "${m.type}" from client "${ws.uuid}".`
    );
    const l = await layerService.getLayers();
    ws.send(JSON.stringify(l));
  }
}

export default new WebSocketMessageHandler();
