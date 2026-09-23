import { useState } from "react";
import PropTypes from "prop-types";
import BaseWindowPlugin from "../BaseWindowPlugin";
import Observer from "react-event-observer";
import PluginIcon from "@mui/icons-material/PermContactCalendar";
import KirLayerController from "./KirLayerController";
import KirModel from "./KirModel";
import KirView from "./KirView";
import KirImport from "../Fir/FirImport";
import KirWfsService from "./KirWfsService";

function Kir(props) {
  const [{ localObserver, model }] = useState(() => {
    const localObserver = new Observer();

    function loadFeatures(features) {
      layerController.clearBeforeSearch();
      layerController.addFeatures(features, { zoomToLayer: true });
      localObserver.publish("kir.search.completed", features);
    }

    function handleSearch(params = {}) {
      let features = model.layers.buffer.getSource().getFeatures();

      if (features.length === 0) {
        features = model.layers.draw.getSource().getFeatures();
      }

      const defaultParams = {
        features: features,
        app: props.app,
        map: props.map,
        searchTypeId: model.config.wfsId,
      };

      layerController.clearBeforeSearch(params);
      localObserver.publish("kir.search.started", params);
      service
        .search(defaultParams, params)
        .then((features) => {
          layerController.addFeatures(features, params);
          localObserver.publish("kir.search.completed", features);
        })
        .catch((error) => {
          localObserver.publish("kir.search.error", error);
        });
    }

    localObserver.subscribe("kir.search.search", handleSearch);
    localObserver.subscribe("kir.search.load", loadFeatures);

    const model = new KirModel({
      localObserver: localObserver,
      app: props.app,
      map: props.map,
    });

    const layerController = new KirLayerController(model, localObserver);

    new KirImport({
      localObserver: localObserver,
      layerController: layerController,
      map: props.map,
      eventPrefix: "kir",
    });

    const service = new KirWfsService(model);

    return { localObserver, model };
  });

  const onWindowShow = () => {
    model.windowIsVisible = true;
  };

  const onWindowHide = () => {
    model.windowIsVisible = false;
  };

  return (
    <BaseWindowPlugin
      {...props}
      type="Kir"
      custom={{
        disablePadding: true,
        icon: <PluginIcon />,
        title: "KIR",
        color: null,
        description: "",
        height: "dynamic",
        width: 400,
        onWindowShow: onWindowShow,
        onWindowHide: onWindowHide,
      }}
    >
      <KirView model={model} app={props.app} localObserver={localObserver} />
    </BaseWindowPlugin>
  );
}

Kir.propTypes = {
  app: PropTypes.object.isRequired,
  map: PropTypes.object.isRequired,
  options: PropTypes.object.isRequired,
};

export default Kir;
