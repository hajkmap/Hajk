import { Prisma } from "@prisma/client";
import log4js from "log4js";

import prisma from "../../../common/prisma.ts";
// import { HajkError } from "../../../common/classes.ts";
// import HttpStatusCodes from "../../../common/http-status-codes.ts";
// import HajkStatusCodes from "../../../common/hajk-status-codes.ts";
// import { getUserRoles } from "../../../common/auth/get-user-roles.ts";
// import { isAuthActive } from "../../../common/auth/is-auth-active.ts";
import getAnalyticsOptionsFromDotEnv from "../utils/get-analytics-options-from-dotenv.ts";
import { buildLegacyLayersConfigForMap } from "../utils/build-legacy-layers-config.ts";
import {
  buildClientMapForMap,
  buildClientProjectionsForMap,
  buildClientToolsForMap,
} from "../utils/build-client-map-config.ts";

const logger = log4js.getLogger("service.v3.public");

class PublicService {
  // In order to ensure compatibility with existing Hajk v4 Client we default
  // to legacy config mode.
  #useLegacyConfig = process.env.USE_LEGACY_MAP_CONFIG ?? true;

  constructor() {
    logger.debug("Initiating Public Service");
  }

  async #getAllMaps() {
    const maps = await prisma.map.findMany({
      where: { deletedAt: null },
      // TODO: If isAuthActive, restrict to only include maps with current user's roles within `roles`.
      select: {
        name: true,
        options: true, // Can't drill further down as `options` is a scalar object (JSON field)
      },
    });

    // Now let's iterate and drop everything but name and title. Also, if we're set to
    // legacy mode, we must follow the old key names.
    const formattedMaps = maps.map((map) => ({
      [this.#useLegacyConfig ? "mapConfigurationName" : "name"]: map.name,
      [this.#useLegacyConfig ? "mapConfigurationTitle" : "title"]:
        (map.options as Prisma.JsonObject)?.title || `Untitled map ${map.name}`,
    }));

    return formattedMaps;
  }

  async getClientConfigForMap(mapName: string, user?: Express.User) {
    logger.debug(
      `Fetching public client config for map "${mapName}", user: ${user?.id || "anonymous"}`
    );

    logger.debug(`USE_LEGACY_MAP_CONFIG is set to ${this.#useLegacyConfig}`);

    // For the legacy config, we want 3 top-level properties:
    // - layersConfig
    // - mapConfig (with its own sub-properties)
    // - userSpecificMaps

    const [layersConfig, analytics, theMap, projections, tools, userSpecificMaps] =
      await Promise.all([
        buildLegacyLayersConfigForMap(mapName),
        Promise.resolve(
          ["plausible", "matomo"].includes(process.env.ANALYTICS_TYPE as string)
            ? getAnalyticsOptionsFromDotEnv()
            : []
        ),
        buildClientMapForMap(mapName),
        buildClientProjectionsForMap(mapName),
        buildClientToolsForMap(mapName),
        this.#getAllMaps(),
      ]);

    return this.#useLegacyConfig
      ? {
          layersConfig,
          mapConfig: {
            analytics,
            map: theMap,
            projections,
            tools,
          },
          userSpecificMaps,
        }
      : {
          notYetImplemented: true,
          message:
            "Non-legacy map config is not yet implemented. The format of the response is subject to changes.",
        };
  }
}

export default new PublicService();
