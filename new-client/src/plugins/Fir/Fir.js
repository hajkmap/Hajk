import React from "react";
import PropTypes from "prop-types";
import BaseWindowPlugin from "../BaseWindowPlugin";

import Observer from "react-event-observer";

import PluginIcon from "@material-ui/icons/House";
import FirModel from "./FirModel";
import FirView from "./FirView";

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

    this.localObserver = Observer();

    this.localObserver.subscribe("firEvent", (message) => {
      console.log(message);
    });

    this.localObserver.subscribe("fir-kml-upload", this.handleFileUpload);

    this.firModel = new FirModel({
      localObserver: this.localObserver,
      app: props.app,
      map: props.map,
    });
  }

  handleFileUpload(file) {
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
        console.log(reader.result);
      };
      reader.readAsText(file);
    } catch (error) {
      console.log(error);
    }
  }

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
          model={this.firModel}
          app={this.props.app}
          localObserver={this.localObserver}
          updateCustomProp={this.updateCustomProp}
        />
      </BaseWindowPlugin>
    );
  }
}

export default Fir;
