import type { Application } from "express";
import log4js from "./utils/hajk-logger.js";

const logger = log4js.getLogger("hajk");

/**
 * Exports a function that sets up all of the routes for all versions.
 *
 * @remarks
 * By looking into the `apiVersions` app global, we can determine at runtime
 * which API versions are enabled and load the corresponding routes dynamically.
 */
export async function initRoutes(app: Application): Promise<void> {
  const apiVersions: number[] = app.get("apiVersions");

  for (const v of apiVersions) {
    try {
      const { default: router } = await import(`../apis/v${v}/router.ts`);
      app.use(`/api/v${v}`, router);
      logger.info(`Loaded routes for /api/v${v}`);
    } catch (error) {
      logger.error(`Failed to loaded routes for /api/v${v}`);
      logger.error(error);
    }
  }
}
