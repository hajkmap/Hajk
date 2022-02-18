import WebSocket from "ws";
import queryString from "query-string";
import log4js from "../../api/utils/hajkLogger";

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

      // We can use 'connectionRequest' to read additional options, such
      // as query parameters and request path:
      const [path, params] = connectionRequest?.url?.split("?") || undefined;
      const connectionParams = queryString.parse(params);

      logger.trace(
        `Upgrade successful. Opening connection. Path: "${path}". Query params: "${JSON.stringify(
          connectionParams
        )}".`
      );

      // We can send messages to the client. Here's a short demo that
      // sends a message every 5th second:
      setInterval(() => {
        websocketConnection.send(
          `Health check from sever. ${new Date().toISOString()}`
        );
      }, 5000);

      // We can receive messages from the client. To handle them,
      // we need this listener:
      websocketConnection.on("message", (message) => {
        const parsedMessage = JSON.parse(message);
        logger.trace(`Got message: "${parsedMessage}"`);

        // Usually we'd like to process the data somehow, but for this
        // demo, let's just send it back to the client.
        websocketConnection.send(
          JSON.stringify({
            message: "Message successfully received over WebSockets!",
            originalMessage: parsedMessage,
          })
        );
      });
    }
  );

  return websocketServer;
};
