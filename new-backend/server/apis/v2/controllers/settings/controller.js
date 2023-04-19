import SettingsService from "../../services/settings.service";
import handleStandardResponse from "../../utils/handleStandardResponse";
import log4js from "log4js";

// Create a logger for admin events, those will be saved in a separate log file.
const ael = log4js.getLogger("adminEvent.v2");

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
          ael.info(`${res.locals.authUser} saved map ${req.query.mapFile}`);
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
        ael.info(`${res.locals.authUser} saved map ${req.query.mapFile}`);
      }
    });
  }

  putLayerOfType(req, res) {
    SettingsService.createOrUpdateLayer(req.params.type, req.body).then(
      (data) => {
        // Can't use handleStandardResponse here because we need to
        // output only data.newLayer on success – not the entire data.
        if (data.error) res.status(500).send(data.error.toString());
        else {
          // r.status will be either 200 (layer updated) or 201 (layer created)
          res.status(data.status).json(data.newLayer);

          ael.info(
            `${res.locals.authUser} ${
              data.status === 201 ? "added" : "updated"
            } ${req.params.type} with id ${data.newLayer.id} ("${
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
          ael.info(
            `${res.locals.authUser} deleted ${req.params.type} with id ${req.params.layerId}`
          );
      }
    );
  }
}
export default new Controller();
