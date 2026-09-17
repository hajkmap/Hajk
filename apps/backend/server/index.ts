import Server from "./common/server.ts";

// We're gonna need to handle uncaught exceptions so that we avoid getting stuck in a restart loop
if (process.env.NODE_ENV !== "production") {
  process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception:", error);
  });

  process.on("unhandledRejection", (reason) => {
    console.error("Unhandled Rejection:", reason);
  });
}

Server.listen();