import React from "react";
import PropTypes from "prop-types";
import BaseWindowPlugin from "../BaseWindowPlugin";
import GeosuiteExportModel from "./GeosuiteExportModel";
import GeosuiteExportView from "./GeosuiteExportView";
import Observer from "react-event-observer";
import GetAppIcon from "@material-ui/icons/GetApp";

class GeosuiteExport extends React.PureComponent {
  state = {
    title: this.props.options.title ?? "Hämta data",
    description: this.props.options.description ?? "Hämta Geotekniska data",
    color: null,
  };

  static propTypes = {
    app: PropTypes.object.isRequired,
    map: PropTypes.object.isRequired,
    options: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    this.localObserver = Observer();
    this.globalObserver = props.app.globalObserver;
    this.model = new GeosuiteExportModel({
      localObserver: this.localObserver,
      app: props.app,
      map: props.map,
    });
  }

  onWindowShow = () => {
    this.model.handleWindowOpen();
  };

  onWindowHide = () => {
    this.model.handleWindowClose();
  };

  render() {
    return (
      <BaseWindowPlugin
        {...this.props}
        type="GeosuiteExport"
        custom={{
          icon: <GetAppIcon />,
          title: this.state.title,
          color: this.state.color,
          description: this.state.description,
          height: 600,
          width: 400,
          onWindowShow: this.onWindowShow,
          onWindowHide: this.onWindowHide,
        }}
      >
        <GeosuiteExportView
          app={this.props.app}
          model={this.model}
          options={this.props.options}
          localObserver={this.localObserver}
          globalObserver={this.globalObserver}
          title={this.state.title}
        />
      </BaseWindowPlugin>
    );
  }
}

export default GeosuiteExport;
