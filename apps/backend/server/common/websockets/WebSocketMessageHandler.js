// This shouldn't probably be handled here, but these imports
// are just for the sake of the example.
import layerService from "../../apis/v3/services/layer.service.ts";
import mapService from "../../apis/v3/services/map.service.ts";

class WebSocketMessageHandler {
  // This Map holds valid message type values, i.e. those
  // message types that we can handle, and the corresponding
  // method that should be invoked for each message type.
  #messageTypeToHandlerMap = new Map([
    ["getLayers", this.#handleGetLayers],
    ["getMaps", this.#handleGetMaps],
  ]);

  // This is the only public method. See it as an entry point
  // to this message handler.
  handleMessage(websocketConnection, parsedMessage) {
    if (this.#messageTypeToHandlerMap.has(parsedMessage.type)) {
      // If a handler exist, let's invoke it. Note the function call
      // _after_ the .get()! We invoke the handler directly, passing
      // the websocket connection and the message received.
      this.#messageTypeToHandlerMap.get(parsedMessage.type)(
        websocketConnection,
        parsedMessage
      );
    } else {
      websocketConnection.send(
        `No message handler for type "${parsedMessage.type}"`
      );
    }
  }

  // And here are our message handlers that actually get the job done.
  // This could be further restructured, logic can be lifted and implemented
  // in classes outside this file, etc. This is just a stub.
  async #handleGetMaps(ws, m) {
    const maps = await mapService.getMapNames();
    ws.send(JSON.stringify(maps));
  }

  async #handleGetLayers(ws, m) {
    const l = await layerService.getLayers();
    ws.send(JSON.stringify(l));
  }
}

export default new WebSocketMessageHandler();
