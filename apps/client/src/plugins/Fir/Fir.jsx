import { useState } from "react";
import PropTypes from "prop-types";
import BaseWindowPlugin from "../BaseWindowPlugin";
import Observer from "react-event-observer";
import PluginIcon from "@mui/icons-material/House";
import FirModel from "./FirModel";
import FirView from "./FirView";
import FirLayerController from "./FirLayerController";
import FirImport from "./FirImport";

function Fir(props) {
  const [{ localObserver, model }] = useState(() => {
    const localObserver = new Observer();

    function getService(type) {
      // This is a factory to get make it possible to lazy-load service chunks
      // It's possible to add more services here
      if (type === "FirWfsService") {
        return import("./FirWfsService");
      } /* else if (type === "OtherServiceClass") {
      return import("./OtherServiceClass");
    }*/
    }

    function loadFeatures(features) {
      layerController.clearBeforeSearch();
      layerController.addFeatures(features, {
        zoomToLayer: true,
        clearPrevious: true,
      });
      localObserver.publish("fir.search.completed", features);
    }

    function handleSearch(params = {}) {
      const type = "FirWfsService";

      let features = model.layers.buffer.getSource().getFeatures();

      if (features.length === 0) {
        features = model.layers.draw.getSource().getFeatures();
      }

      const defaultParams = {
        features: features,
        app: props.app,
        map: props.map,
      };

      getService(type).then((Service) => {
        const service = new Service.default(defaultParams, model);

        layerController.clearBeforeSearch(params);
        localObserver.publish("fir.search.started", params);
        service
          .search(params)
          .then((features) => {
            // We're expecting an array of features.
            layerController.addFeatures(features, params);
            localObserver.publish("fir.search.completed", features);
          })
          .catch((error) => {
            localObserver.publish("fir.search.error", error);
          });
      });
    }

    localObserver.subscribe("fir.search.search", handleSearch);
    localObserver.subscribe("fir.search.load", loadFeatures);

    const model = new FirModel({
      localObserver: localObserver,

      app: props.app,
      map: props.map,
    });

    const layerController = new FirLayerController(model, localObserver);

    new FirImport({
      localObserver: localObserver,
      layerController: layerController,
      map: props.map,
    });

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
      type="Fir"
      custom={{
        disablePadding: true,
        icon: <PluginIcon />,
        title: "FIR",
        color: null,
        description: "",
        height: "auto",
        width: 400,
        onWindowShow: onWindowShow,
        onWindowHide: onWindowHide,
      }}
    >
      <FirView model={model} app={props.app} localObserver={localObserver} />
    </BaseWindowPlugin>
  );
}

Fir.propTypes = {
  app: PropTypes.object.isRequired,
  map: PropTypes.object.isRequired,
  options: PropTypes.object.isRequired,
};

export default Fir;
