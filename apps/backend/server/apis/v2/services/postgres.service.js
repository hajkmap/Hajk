import log4js from "log4js";
import pg from "pg";

const logger = log4js.getLogger("service.postgres.v2");

class PostgresService {
  pool;
  escapeLiteral;

  constructor() {
    logger.trace("Initiating PostgresService V2");

    this.pool = new pg.Pool({
      connectionString: process.env.POSTGRES_CONNECTION_STRING,
      max: 10, // max number of clients in the pool
      // TODO: There are more options that can be configured here, such
      // as idleTimeoutMillis, connectionTimeoutMillis, etc. Let's review
      // what's needed for our use case and expose in .env
    });
    this.escapeLiteral = pg.escapeLiteral;

    this.checkConnection();
  }

  checkConnection() {
    this.pool.query("SELECT 1", (err) => {
      if (err) {
        logger.error(
          "Could not connect to Postgres database due to error:\n",
          err instanceof AggregateError
            ? err.errors.map((e) => e.message).join("\n")
            : err.message
        );
      } else logger.info("Successfully connected to Postgres database");
    });
  }
}

export default new PostgresService();
