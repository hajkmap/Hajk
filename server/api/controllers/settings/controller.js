import SettingsService from "../../services/settings.service";

export class Controller {
  putSettingsToMapFile(req, res) {
    SettingsService.updateMapFile(req.query.mapFile, req.body, req.url).then(
      (r) => {
        // If r contains mapConfig, update has succeeded
        if (r.mapConfig) res.status(200).json(r.mapConfig);
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
      if (r.newLayer) res.status(r.status).json(r.newLayer);
      // If r contains message, it looks like we got back an error object
      else if (r.message) res.status(500).send(r.message);
      else res.status(500).send(r);
    });
  }

  deleteLayerFromStore(req, res) {
    SettingsService.deleteLayer(req.params.type, req.params.layerId).then(
      (r) => {
        if (r && !r.error) res.json(r);
        else res.status(500).send(r.error.message);
      }
    );
  }
}
export default new Controller();
