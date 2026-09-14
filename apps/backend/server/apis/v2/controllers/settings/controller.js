import SettingsService from "../../services/settings.service.js";
import handleStandardResponse from "../../utils/handleStandardResponse.js";
import log4js from "log4js";

// Create a logger for admin events, those will be saved in a separate log file.
const ael = log4js.getLogger("adminEvent.v2");

// General logger for this controller, used e.g. for diagnostics.
const logger = log4js.getLogger("settings.controller.v2");

export class Controller {
  putSettingsToMapFile(req, res) {
    SettingsService.updateMapFile(req.query.mapFile, req.body, req.url).then(
      (data) => {
        // Can't use handleStandardResponse here because we need to
        // output only data.mapConfig on success – not the entire data.
        if (data.error) res.status(500).send(data.error.toString());
        else {
          // Send response
          res.status(200).json(data.mapConfig);
          // Log admin action
          ael.info(`saved map ${req.query.mapFile}`);
        }
      }
    );
  }

  updateMapTool(req, res) {
    SettingsService.updateMapTool(
      req.params.map,
      req.params.tool,
      req.body
    ).then((data) => {
      // Can't use handleStandardResponse here because we need to
      // output only data.mapConfig on success – not the entire data.
      if (data.error) res.status(500).send(data.error.toString());
      else {
        // Send response
        res.sendStatus(data);
        // Log admin action
        ael.info(`saved map ${req.query.mapFile}`);
      }
    });
  }

  putLayerOfType(req, res) {
    // Diagnostic: Express's JSON body parser only parses the body when the
    // request looks like it has one, i.e. when a Content-Length or a
    // Transfer-Encoding header is present (see type-is' hasBody()). If a
    // reverse proxy forwards the request without either header, the parser is
    // skipped and req.body becomes undefined, resulting in an otherwise cryptic
    // 500. Log the relevant headers so this can be diagnosed at the proxy.
    if (req.body === undefined || typeof req.body !== "object") {
      logger.warn(
        "%s /settings/%s received a body that was not parsed as JSON. Content-Type=%o, Content-Length=%o, Transfer-Encoding=%o, typeof body=%s. This is usually caused by a reverse proxy forwarding the request without a Content-Length (or Transfer-Encoding) header.",
        req.method,
        req.params.type,
        req.headers["content-type"],
        req.headers["content-length"],
        req.headers["transfer-encoding"],
        typeof req.body
      );
    }

    SettingsService.createOrUpdateLayer(req.params.type, req.body).then(
      (data) => {
        // Can't use handleStandardResponse here because we need to
        // output only data.newLayer on success – not the entire data.
        if (data.error) res.status(500).send(data.error.toString());
        else {
          // r.status will be either 200 (layer updated) or 201 (layer created)
          res.status(data.status).json(data.newLayer);

          ael.info(
            `${data.status === 201 ? "added" : "updated"} ${req.params.type} with id ${data.newLayer.id} ("${
              data.newLayer.caption
            }")`
          );
        }
      }
    );
  }

  deleteLayerFromStore(req, res) {
    SettingsService.deleteLayer(req.params.type, req.params.layerId).then(
      (data) => {
        handleStandardResponse(res, data);
        !data.error &&
          ael.info(`deleted ${req.params.type} with id ${req.params.layerId}`);
      }
    );
  }
}
export default new Controller();
