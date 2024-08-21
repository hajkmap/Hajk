import log4js from "log4js";

import PostgresService from "./postgres.service.js";

const logger = log4js.getLogger("service.search.v2");

class SearchService {
  constructor() {
    logger.trace("Initiating SearchService V2");

    this.pool = PostgresService.pool;
  }

  #getCTEFromSources = (escapedQueryString, sources, limitPerSource = 10) => {
    return sources.map((source) => {
      return `${source.column}_matches AS (
        SELECT DISTINCT ${source.column} AS hit,
                similarity(${source.column}, ${escapedQueryString}) AS similarity_score,
                '${source.column}' AS match_column
        FROM ${source.table}
        WHERE ${source.column} % ${escapedQueryString}
        ORDER BY similarity_score DESC
        LIMIT ${limitPerSource}
      )`;
    });
  };

  #getSelectAllSqlFromSources = (sources) => {
    return sources.map((source) => {
      return `SELECT * FROM ${source.column}_matches`;
    });
  };

  /**
   * @summary TODO
   *
   * @param {*} TODO
   * @returns {object} TODO
   * @memberof SearchService
   */
  async autocomplete(json, user) {
    try {
      // Extract everything we need to construct the query
      const {
        queryString,
        sources,
        pgTrgmSimilarityThreshold,
        limitPerSource,
        totalLimit,
      } = json;

      if (
        !queryString ||
        !sources ||
        !pgTrgmSimilarityThreshold ||
        !totalLimit ||
        !limitPerSource
      ) {
        throw new Error("Request body did not contain all required fields.");
      }

      // Keep in mind that this comes from user input and can contain an
      // attempted SQL injection. Let's escape using the provided method.
      const escapedQueryString = PostgresService.escapeLiteral(queryString);

      logger.debug(
        `Running autocomplete for query string: ${escapedQueryString}.`
      );
      logger.debug("Will match these sources:", sources);

      const sql = `
        SET pg_trgm.similarity_threshold = ${pgTrgmSimilarityThreshold};
        WITH ${this.#getCTEFromSources(escapedQueryString, sources, limitPerSource).join(", ")}
        SELECT hit,
              similarity_score,
              match_column
        FROM (
          ${this.#getSelectAllSqlFromSources(sources).join(" UNION ALL ")}
        ) AS all_matches
        ORDER BY similarity_score DESC
        LIMIT ${totalLimit};
        RESET pg_trgm.similarity_threshold;
        `;

      logger.trace(sql);
      const res = await this.pool.query(sql);

      return res[1].rows;
    } catch (error) {
      logger.error(`Error while doing autocomplete search: ${error.message}`);
      logger.trace("Request body:", json);
      return { error };
    }
  }
}

export default new SearchService();
