import React from "react";
import PropTypes from "prop-types";
import BaseWindowPlugin from "../BaseWindowPlugin";
import Observer from "react-event-observer";
import PluginIcon from "@material-ui/icons/PermContactCalendar";
import KirModel from "./KirModel";
import KirView from "./KirView";

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

    this.model = new KirModel({
      localObserver: this.localObserver,
      app: props.app,
      map: props.map,
    });
  }

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
