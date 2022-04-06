import React from "react";
import PropTypes from "prop-types";
import BaseWindowPlugin from "../BaseWindowPlugin";
import Observer from "react-event-observer";
import PluginIcon from "@material-ui/icons/PermContactCalendar";
import KirLayerController from "./KirLayerController";
import KirModel from "./KirModel";
import KirView from "./KirView";
import KirImport from "../Fir/FirImport";
import KirWfsService from "./KirWfsService";

class Kir extends React.PureComponent {
  state = {
    title: "KIR",
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

    this.localObserver.subscribe("kir.search.search", this.handleSearch);
    this.localObserver.subscribe("kir.search.load", this.loadFeatures);

    this.model = new KirModel({
      localObserver: this.localObserver,
      app: props.app,
      map: props.map,
    });

    this.layerController = new KirLayerController(
      this.model,
      this.localObserver
    );

    this.import = new KirImport({
      localObserver: this.localObserver,
      layerController: this.layerController,
      map: props.map,
      eventPrefix: "kir",
    });

    this.service = new KirWfsService(this.model);
  }

  onWindowShow = () => {
    this.model.windowIsVisible = true;
  };

  onWindowHide = () => {
    this.model.windowIsVisible = false;
  };

  loadFeatures = (features) => {
    this.layerController.clearBeforeSearch();
    this.layerController.addFeatures(features, { zoomToLayer: true });
    this.localObserver.publish("kir.search.completed", features);
  };

  handleSearch = (params = {}) => {
    let features = this.model.layers.buffer.getSource().getFeatures();

    if (features.length === 0) {
      features = this.model.layers.draw.getSource().getFeatures();
    }

    const defaultParams = {
      features: features,
      app: this.props.app,
      map: this.props.map,
      searchTypeId: this.model.config.wfsId,
    };

    this.layerController.clearBeforeSearch(params);
    this.localObserver.publish("kir.search.started", params);
    this.service
      .search(defaultParams, params)
      .then((features) => {
        this.layerController.addFeatures(features, params);
        this.localObserver.publish("kir.search.completed", features);
      })
      .catch((error) => {
        this.localObserver.publish("kir.search.error", error);
      });
  };

  render() {
    return (
      <BaseWindowPlugin
        {...this.props}
        type="Kir"
        custom={{
          icon: <PluginIcon />,
          title: this.state.title,
          color: this.state.color,
          description: "",
          height: "dynamic",
          width: 400,
          onWindowShow: this.onWindowShow,
          onWindowHide: this.onWindowHide,
        }}
      >
        <KirView
          model={this.model}
          app={this.props.app}
          localObserver={this.localObserver}
        />
      </BaseWindowPlugin>
    );
  }
}

export default Kir;
