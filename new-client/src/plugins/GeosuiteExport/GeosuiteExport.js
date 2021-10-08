import React from "react";
import PropTypes from "prop-types";
import BaseWindowPlugin from "../BaseWindowPlugin";
import GeosuiteExportModel from "./GeosuiteExportModel";
import GeosuiteExportView from "./GeosuiteExportView";
import Observer from "react-event-observer";
import EditLocationIcon from "@material-ui/icons/EditLocation";

class GeosuiteExport extends React.PureComponent {
  state = {
    title: this.props.options.title ?? "Hämta data",
    description: this.props.options.description ?? "Hämta Geotekniska data",
    color: null,
    playing: false,
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

    this.geosuiteExportModel = new GeosuiteExportModel({
      localObserver: this.localObserver,
      app: props.app,
      map: props.map,
    });
  }

  render() {
    return (
      <BaseWindowPlugin
        {...this.props}
        type="GeosuiteExport"
        custom={{
          icon: <EditLocationIcon />,
          title: this.state.title,
          color: this.state.color,
          description: this.state.description,
          height: 450,
          width: 400,
        }}
      >
        <GeosuiteExportView
          model={this.geosuiteExportModel}
          app={this.props.app}
          map={this.props.map}
          localObserver={this.localObserver}
        />
      </BaseWindowPlugin>
    );
  }
}

export default GeosuiteExport;
