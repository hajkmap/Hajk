import log4js from "log4js";
import ConfigService from "../services/config.service.js";
import handleStandardResponse from "../utils/handleStandardResponse.js";
import { AccessError } from "../utils/AccessError.js";
import { InvalidPathError } from "../utils/safePath.js";

const logger = log4js.getLogger("router.v2");

// Never echo the original error: it can contain paths, map or user names.
const deny = (res) =>
  handleStandardResponse(res, { error: new AccessError("Access denied.") });

/**
 * @summary Only let the request through if the user can see one of the given tools,
 * with the given option, in the map that the client sends as `req.body.map`.
 * @description Uses ConfigService.getMapConfig(map, user), so map access and the
 * tools' and options' visibleForGroups are applied exactly as for the client UI.
 * The client can name any map, but it only gets access through maps where the
 * user could already use the tool.
 *
 * @param {Array<{type: string, option: string}>} rules Accepted tool type (lower case)
 * and option key pairs, e.g. [{ type: "fir", option: "propertyList" }]
 */
export default function restrictToTools(rules) {
  return async function (req, res, next) {
    const user = res.locals.authUser;
    try {
      if (process.env.AD_LOOKUP_ACTIVE !== "true") {
        logger.warn(
          "AD lookup is disabled, so anyone has access to %s as long as the map has the tool.",
          req.originalUrl
        );
      }

      const map = req.body?.map;
      if (typeof map !== "string" || map.trim() === "") {
        logger.warn(
          "Access to %s denied for %o: no map in request",
          req.originalUrl,
          user
        );
        return deny(res);
      }

      const config = await ConfigService.getMapConfig(map, user);

      if (config.error) {
        // Caused by the request (no access to the map, unknown map or invalid name):
        // answer 403 for all of them, so map names can't be probed.
        if (
          config.error.statusCode === 403 ||
          config.error.code === "ENOENT" ||
          config.error instanceof InvalidPathError
        ) {
          logger.warn(
            "Access to %s denied for %o: %s",
            req.originalUrl,
            user,
            config.error.message
          );
          return deny(res);
        }
        throw config.error; // Parse error, AD error…
      }

      const allowed =
        Array.isArray(config.tools) &&
        config.tools.some((t) =>
          rules.some(
            (r) => t.type?.toLowerCase() === r.type && t.options?.[r.option]
          )
        );
      if (allowed) return next();

      logger.warn(
        "Access to %s denied for %o: no access to %o in %s",
        req.originalUrl,
        user,
        rules,
        map
      );
      return deny(res);
    } catch (error) {
      logger.error(
        "Could not check access to %s: %s",
        req.originalUrl,
        error.message
      );
      return handleStandardResponse(res, {
        error: new Error("Could not verify access."),
      });
    }
  };
}
