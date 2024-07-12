import log4js from "log4js";

import PostgresService from "./postgres.service.js";

const logger = log4js.getLogger("service.search.v2");

class SearchService {
  constructor() {
    logger.trace("Initiating SearchService V2");

    this.pool = PostgresService.pool;
  }

  #getCTEFromSources = (queryString, sources, limitPerSource = 10) => {
    return sources.map((source) => {
      return `${source.column}_matches AS (
        SELECT DISTINCT ${source.column} AS hit,
                similarity(${source.column}, '${queryString}') AS similarity_score,
                '${source.column}' AS match_column
        FROM ${source.table}
        WHERE ${source.column} % '${queryString}'
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
      logger.trace(`Running autocomplete for query string: '${queryString}'.`);
      logger.trace("Will match these sources:", sources);

      const sql = `
        SET pg_trgm.similarity_threshold = ${pgTrgmSimilarityThreshold};
        WITH ${this.#getCTEFromSources(queryString, sources, limitPerSource).join(", ")}
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
      const res = await this.pool.query(sql);

      return res[1].rows;
    } catch (error) {
      logger.warn(`Error while doing autocomplete search.`);
      return { error };
    }
  }
}

export default new SearchService();
