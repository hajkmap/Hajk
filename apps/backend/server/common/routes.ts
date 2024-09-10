import express from "express";
import log4js from "../common/utils/hajkLogger.js";

const logger = log4js.getLogger("hajk");

/**
 * Exports a function that sets up all of the routes for all versions.
 *
 * @remarks
 * By looking into the `apiVersions` app global, we can determine at runtime
 * which API versions are enabled and load the corresponding routes dynamically.
 */
export async function initRoutes(app: express.Application): Promise<void> {
  const apiVersions: number[] = app.get("apiVersions");

  for (const v of apiVersions) {
    try {
      let versionRouter; // Will hold the actual imported module

      try {
        // Let's try grabbing the JS file
        const { default: router } = await import(`../apis/v${v}/router.js`);
        versionRouter = router;
      } catch {
        // If it fails, let's attempt to get the TS file
        const { default: router } = await import(`../apis/v${v}/router.ts`);
        versionRouter = router;
      }

      app.use(`/api/v${v}`, versionRouter);
      logger.info(`Loaded routes for /api/v${v}`);
    } catch (error) {
      logger.error(`Failed to loaded routes for /api/v${v}`);
      logger.error(error);
    }
  }
}
