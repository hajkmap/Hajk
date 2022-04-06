import React from "react";
import PropTypes from "prop-types";
import BaseWindowPlugin from "../BaseWindowPlugin";
import Observer from "react-event-observer";
import PluginIcon from "@material-ui/icons/House";
import FirModel from "./FirModel";
import FirView from "./FirView";
import FirLayerController from "./FirLayerController";
import FirImport from "./FirImport";
import styles from "./FirStyles";
/* eslint-disable no-unused-vars */
import FirWfsService from "./FirWfsService";
/* eslint-enable no-unused-vars */

class Fir extends React.PureComponent {
  state = {
    title: "FIR",
    color: null,
  };

  static propTypes = {
    app: PropTypes.object.isRequired,
    map: PropTypes.object.isRequired,
    options: PropTypes.object.isRequired,
  };

  static defaultProps = {
    options: {},
  };

  constructor(props) {
    super(props);

    this.localObserver = new Observer();

    this.localObserver.subscribe("fir.search.search", this.handleSearch);
    this.localObserver.subscribe("fir.search.load", this.loadFeatures);

    this.model = new FirModel({
      localObserver: this.localObserver,

      app: props.app,
      map: props.map,
    });

    this.layerController = new FirLayerController(
      this.model,
      this.localObserver
    );

    this.import = new FirImport({
      localObserver: this.localObserver,
      layerController: this.layerController,
      map: props.map,
    });

    styles.setModel(this.model);
  }

  onWindowShow = () => {
    this.model.windowIsVisible = true;
  };

  onWindowHide = () => {
    this.model.windowIsVisible = false;
  };

  getService(type) {
    // This is a factory to get make it possible to lazy-load service chunks
    // It's possible to add more services here
    if (type === "FirWfsService") {
      return import("./FirWfsService");
    } /* else if (type === "OtherServiceClass") {
      return import("./OtherServiceClass");
    }*/
  }

  loadFeatures = (features) => {
    this.layerController.clearBeforeSearch();
    this.layerController.addFeatures(features, { zoomToLayer: true });
    this.localObserver.publish("fir.search.completed", features);
  };

  handleSearch = (params = {}) => {
    const type = "FirWfsService";

    let features = this.model.layers.buffer.getSource().getFeatures();

    if (features.length === 0) {
      features = this.model.layers.draw.getSource().getFeatures();
    }

    const defaultParams = {
      features: features,
      app: this.props.app,
      map: this.props.map,
    };

    this.getService(type).then((Service) => {
      const service = new Service.default(defaultParams, this.model);

      this.layerController.clearBeforeSearch(params);
      this.localObserver.publish("fir.search.started", params);
      service
        .search(params)
        .then((features) => {
          // We're expecting an array of features.
          this.layerController.addFeatures(features, params);
          this.localObserver.publish("fir.search.completed", features);
        })
        .catch((error) => {
          this.localObserver.publish("fir.search.error", error);
        });
    });
  };

  render() {
    return (
      <BaseWindowPlugin
        {...this.props}
        type="Fir"
        custom={{
          icon: <PluginIcon />,
          title: this.state.title,
          color: this.state.color,
          description: "",
          height: "auto",
          width: 400,
          onWindowShow: this.onWindowShow,
          onWindowHide: this.onWindowHide,
        }}
      >
        <FirView
          model={this.model}
          app={this.props.app}
          localObserver={this.localObserver}
        />
      </BaseWindowPlugin>
    );
  }
}

export default Fir;
