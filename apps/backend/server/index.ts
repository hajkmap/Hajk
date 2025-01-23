import Server from "./common/server.ts";

// We're gonna need to handle uncaught exceptions so that we avoid getting stuck in a restart loop
if (process.env.NODE_ENV !== "production") {
  process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception:", error.message, "\n");
    console.error("Stack Trace:", error.stack);
  });
}

Server.listen();
