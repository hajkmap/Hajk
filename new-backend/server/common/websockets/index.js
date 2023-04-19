import crypto from "crypto";
import WebSocket from "ws";
import queryString from "query-string";
import log4js from "../utils/hajkLogger";
import WebSocketMessageHandler from "./WebSocketMessageHandler";

// Just a small example of how we can handle sending synchronized
// messages to all connected clients.
function broadcastToClients(clients) {
  let broadcastId = 0;
  setInterval(() => {
    for (let c of clients.values()) {
      c.send(`Broadcast message number ${++broadcastId}`);
    }
  }, 3000);
}

export default async (expressServer) => {
  const logger = log4js.getLogger("websockets");

  logger.trace("Initiating WebSockets");

  const websocketServer = new WebSocket.Server({
    noServer: true, // we don't want the WebSocket constructor to create an additional HTTP - we're already in Express!
    path: "/api/v2/websockets", // Path that we'll listen on for upgrade requests
  });

  // Upgrade request event handler
  expressServer.on("upgrade", (request, socket, head) => {
    logger.trace(`Upgrade to WebSockets initiated by call to "${request.url}"`);
    websocketServer.handleUpgrade(request, socket, head, (websocket) => {
      websocketServer.emit("connection", websocket, request);
    });
  });

  // Let's setup a broadcast channel, just for fun. Any and all
  // connected clients will get the same message at the same time.
  broadcastToClients(websocketServer.clients);

  // Handler for established socket connection
  websocketServer.on(
    "connection",
    function connection(websocketConnection, connectionRequest) {
      // When the connection is successfully upgraded we end up here.
      // This is our chance to setup listeners (e.g. "what should we do
      // when a message is received?") and optionally send messages back
      // to the client.

      // 'websocketConnection' is the active, opened connection.
      // 'connectionRequest' is the original HTTP request that was
      // used to upgrade the request to WebSocket.

      // First, let's set a unique ID on this specific connection:
      websocketConnection.uuid = crypto.randomUUID();

      // We can use 'connectionRequest' to read additional options, such
      // as query parameters and request path:
      const [path, params] = connectionRequest?.url?.split("?") || undefined;
      const connectionParams = queryString.parse(params);

      logger.trace(
        `Upgrade successful. Opening connection ${
          websocketConnection.uuid
        }. Path: "${path}". Query params: "${JSON.stringify(
          connectionParams
        )}".`
      );

      // Let's be polite:
      websocketConnection.send(`Hello ${websocketConnection.uuid}!`);

      // We can also setup a health check:
      let healthCheckId = 0;
      setInterval(() => {
        websocketConnection.send(
          `Health check ${++healthCheckId} for connection ${
            websocketConnection.uuid
          }. ${new Date().toISOString()}`
        );
      }, 1000);

      // In addition to sending, we can also receive messages from the client.
      // To handle them, we need this listener:
      websocketConnection.on("message", (message) => {
        try {
          const parsedMessage = JSON.parse(message);
          logger.trace(
            `Got message from ${websocketConnection.uuid}: "${parsedMessage}"`
          );

          // First let's see if there's a 'type' property on the message…
          if (!parsedMessage.type) {
            // … and abort if there isn't.
            websocketConnection.send("'type' not provided. Aborting.");
            return;
          }

          // If we got here, it looks like we have a 'type' property.
          // Let's dispatch an event, providing our webSocketConnection, so
          // that the handler can send a response.
          // The WebSocketMessageHandler will take care of the details!
          WebSocketMessageHandler.handleMessage(
            websocketConnection,
            parsedMessage
          );
        } catch (error) {
          websocketConnection.send(
            `Couldn't parse message. Error: ${error.message}`
          );

          return;
        }
      });

      // This will be called when connection is closed. Can be used for
      // various cleanups.
      websocketConnection.on("close", () => {
        // Can't send a message at this time, but we can at least log
        logger.trace(`Goodbye ${websocketConnection.uuid}!`);
      });
    }
  );

  return websocketServer;
};
