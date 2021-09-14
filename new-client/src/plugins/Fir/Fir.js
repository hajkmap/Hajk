import React from "react";
import PropTypes from "prop-types";
import BaseWindowPlugin from "../BaseWindowPlugin";
import { GeoJSON, WFS } from "ol/format";

import Observer from "react-event-observer";

import PluginIcon from "@material-ui/icons/House";
import FirModel from "./FirModel";
import FirView from "./FirView";
import FirLayerController from "./FirLayerController";
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

    this.localObserver.subscribe("firEvent", (message) => {
      console.log(message);
    });

    this.localObserver.subscribe("fir.kml_upload", this.handleFileUpload);
    this.localObserver.subscribe("fir.search.search", this.handleSearch);

    this.model = new FirModel({
      localObserver: this.localObserver,
      app: props.app,
      map: props.map,
    });

    this.layerController = new FirLayerController(
      this.model,
      this.localObserver
    );
  }

  handleFileUpload = (file) => {
    try {
      if (!file) {
        return;
      }
      const fileType = file.type ? file.type : file.name.split(".").pop();

      if (
        fileType !== "kml" &&
        fileType !== "application/vnd.google-earth.kml+xml"
      ) {
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        // console.log(reader.result);
      };
      reader.readAsText(file);
    } catch (error) {
      console.log(error);
    }
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

  handleSearch = (params = {}) => {
    const type = "FirWfsService"; // TODO: Remove hard coded value when needed
    const defaultParams = {}; // TODO: Remove hard coded value when needed

    // Prepared for other types of services
    this.getService(type).then((Service) => {
      const service = new Service.default(defaultParams);
      try {
        service.search(params).then((features) => {
          // Expect an array of features.
          this.layerController.addFeatures(features);
          this.localObserver.publish("fir.search.completed", features);
        });
      } catch (error) {
        console.error(error);
      }
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
        }}
      >
        <FirView
          model={this.model}
          app={this.props.app}
          localObserver={this.localObserver}
          updateCustomProp={this.updateCustomProp}
        />
      </BaseWindowPlugin>
    );
  }
}

export default Fir;
