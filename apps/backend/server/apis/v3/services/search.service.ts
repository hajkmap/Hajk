import { PrismaClient } from "@prisma/client";

import log4js from "log4js";

import { HajkError } from "../../../common/classes.ts";
import HttpStatusCodes from "../../../common/HttpStatusCodes.ts";
import HajkStatusCodes from "../../../common/HajkStatusCodes.ts";

interface SearchSource {
  table: string;
  column: string;
}

interface JsonBody {
  queryString: string;
  pgTrgmSimilarityThreshold: number;
  limitPerSource: number;
  totalLimit: number;
  sources: SearchSource[];
}

const logger = log4js.getLogger("service.search.v3");

class SearchService {
  gisdataPrisma: PrismaClient;

  constructor() {
    logger.trace("Initiating SearchService");

    if (process.env.PG_GISDATA_CONNECTION_STRING === undefined) {
      logger.warn(
        "PG_GISDATA_CONNECTION_STRING not set. All endpoints that use the SearchService will not work."
      );
    }

    // Please note that this services uses a custom Prisma Client connection
    // that connects it to another database than the default one which holds
    // Hajk config. The reason is that we will probably keep Hajk config and
    // additional GIS data (such as tables holding addresses, properties, etc.)
    // separate from each other.
    this.gisdataPrisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.PG_GISDATA_CONNECTION_STRING || "",
        },
      },
    });
  }

  #getCTEFromSources = (
    safeQueryString: string,
    sources: SearchSource[],
    safeLimitPerSource = 10
  ) => {
    return sources.map((source) => {
      const column = this.#sanitizeStringForSql(source.column);
      const table = this.#sanitizeStringForSql(source.table);
      return `${column}_matches AS (
        SELECT DISTINCT ${column} AS hit,
                similarity(${column}, '${safeQueryString}') AS similarity_score,
                '${column}' AS match_column
        FROM ${table}
        WHERE ${column} % '${safeQueryString}'
        ORDER BY similarity_score DESC
        LIMIT ${safeLimitPerSource}
      )`;
    });
  };

  #getSelectAllSqlFromSources = (sources: SearchSource[]) => {
    return sources.map((source) => {
      return `SELECT * FROM ${this.#sanitizeStringForSql(source.column)}_matches`;
    });
  };

  /**
   * Attempts to sanitize a string for SQL. The removed characters are:
   *  - Quotes: ', ".
   *  - Comment sequences: --, /* ...
   *  - Statement terminators: ;.
   *  - Escape sequences: \.
   *  - Special characters: |, &, ^, *, (), %, #, $, @, !, backticks (`), tildes (~).
   */
  #sanitizeStringForSql(str: unknown): string | number {
    if (typeof str === "number") {
      // If the parameter already is a number, we don't need to sanitize it
      // as it won't contain any harmful characters. On the contrary, the sanitization
      // below is risky as it would turn valid floating point numbers into invalid strings,
      // e.g. 0.2 -> 02, which is further interpreted as 2, which is not what we meant.
      return str;
    }

    // Whatever else we've got, let's ensure we're working with a string
    const r = String(str);

    // Remove harmful characters as specified in the comment above
    return r.replace(/['"\\\--/*()|&^%$#@!`~;]/g, "");
  }

  async autocomplete(json: JsonBody) {
    if (process.env.PG_GISDATA_CONNECTION_STRING === undefined) {
      throw new HajkError(
        HttpStatusCodes.SERVICE_UNAVAILABLE,
        "Search service is not available.",
        HajkStatusCodes.SEARCH_SERVICE_NOT_AVAILABLE
      );
    }
    // Extract everything we need to construct the query
    const {
      queryString,
      sources,
      pgTrgmSimilarityThreshold,
      limitPerSource,
      totalLimit,
    } = json;

    const safeQueryString = this.#sanitizeStringForSql(queryString);
    const safePgTrgmSimilarityThreshold = this.#sanitizeStringForSql(
      pgTrgmSimilarityThreshold
    );
    const safeTotalLimit = this.#sanitizeStringForSql(totalLimit);
    const safeLimitPerSource = this.#sanitizeStringForSql(limitPerSource);

    if (
      !safeQueryString ||
      !sources ||
      !safePgTrgmSimilarityThreshold ||
      !safeTotalLimit ||
      !safeLimitPerSource
    ) {
      throw new HajkError(
        HttpStatusCodes.BAD_REQUEST,
        "Request body did not contain all the required fields.",
        HajkStatusCodes.INVALID_REQUEST_BODY
      );
    }

    logger.trace(
      `Santitized query: "${safeQueryString}". Original query: "${queryString}".`
    );
    logger.trace("Search sources:", sources);

    const sql = `
        WITH ${this.#getCTEFromSources(safeQueryString as string, sources, safeLimitPerSource as number).join(", ")}
        SELECT hit,
              similarity_score,
              match_column
        FROM (
          ${this.#getSelectAllSqlFromSources(sources).join(" UNION ALL ")}
        ) AS all_matches
        ORDER BY similarity_score DESC
        LIMIT ${safeTotalLimit};
        
        `;
    logger.trace("SQL:", sql);

    // We can't perform a multi-statement query with Prisma,
    // so we split it up into three separeate queries.

    // First, let's change the similarity threshold for pg_trgm
    await this.gisdataPrisma.$queryRawUnsafe(
      `SET pg_trgm.similarity_threshold = ${safePgTrgmSimilarityThreshold}`
    );

    // Next, let's run the main query
    const res = await this.gisdataPrisma.$queryRawUnsafe(sql);

    // Finally, reset similarity threshold
    await this.gisdataPrisma.$queryRawUnsafe(
      `RESET pg_trgm.similarity_threshold;`
    );

    return res;
  }
}

export default new SearchService();
