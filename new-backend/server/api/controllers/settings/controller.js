import SettingsService from "../../services/settings.service";
import log4js from "log4js";

// Create a logger for admin events, those will be saved in a separate log file.
const ael = log4js.getLogger("adminEvent");

export class Controller {
  putSettingsToMapFile(req, res) {
    SettingsService.updateMapFile(req.query.mapFile, req.body, req.url).then(
      (r) => {
        // If r contains mapConfig, update has succeeded
        if (r.mapConfig) {
          // Send response
          res.status(200).json(r.mapConfig);
          // Log admin action
          ael.info(`${res.locals.authUser} saved map ${req.query.mapFile}`);
        }
        // If r contains message, it looks like we got back an error object
        // FIXME: Just check if 'r instanceof Error' and if so, send(r.toString()) so we also get Error name, not only message
        else if (r.message) res.status(500).send(r.message);
        // Else, we have no idea what we got, but it can't be good…
        else res.status(500).send(r);
      }
    );
  }

  putLayerOfType(req, res) {
    SettingsService.createOrUpdateLayer(req.params.type, req.body).then((r) => {
      // r.status will be either 200 (layer updated) or 201 (layer created)
      if (r.newLayer) {
        res.status(r.status).json(r.newLayer);

        // Print a nice admin log message. Will result in something like:
        // [2021-01-01 11:11] INFO: foobar123 added wmslayer with id 42 ("Some layer")
        ael.info(
          `${res.locals.authUser} ${r.status === 200 ? "added" : "updated"} ${
            req.params.type
          } with id ${r.newLayer.id} ("${r.newLayer.caption}")`
        );
      }
      // If r contains message, it looks like we got back an error object
      else if (r.message) res.status(500).send(r.message);
      else res.status(500).send(r);
    });
  }

  deleteLayerFromStore(req, res) {
    SettingsService.deleteLayer(req.params.type, req.params.layerId).then(
      (r) => {
        if (r && !r.error) {
          res.json(r);
          // Print an admin log message
          ael.info(
            `${res.locals.authUser} deleted ${req.params.type} with id ${req.params.layerId}`
          );
        } else res.status(500).send(r.error.message);
      }
    );
  }
}
export default new Controller();
