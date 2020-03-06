// Generic imports – all plugins need these
import React from "react";
import PropTypes from "prop-types";
import BaseWindowPlugin from "../BaseWindowPlugin";

// Plugin-specific imports. Most plugins will need a Model, View and Observer
// but make sure to only create and import whatever you need.
import PrintModel from "./PrintModel";
import PrintView from "./PrintView";
import Observer from "react-event-observer";

// All plugins will need to display an icon. Make sure to pick a relevant one from Material UI Icons.
import PrintIcon from "@material-ui/icons/Print";

/**
 * @summary Main class for the Dummy plugin.
 * @description The purpose of having a Dummy plugin is to exemplify
 * and document how plugins should be constructed in Hajk.
 * The plugins can also serve as a scaffold for other plugins: simply
 * copy the directory, rename it and all files within, and change logic
 * to create the plugin you want to.
 *
 * @class Dummy
 * @extends {React.PureComponent}
 */
class Print extends React.PureComponent {
  state = {};

  static propTypes = {
    app: PropTypes.object.isRequired,
    map: PropTypes.object.isRequired,
    options: PropTypes.object.isRequired
  };

  static defaultProps = {
    options: {}
  };

  constructor(props) {
    super(props);

    this.localObserver = Observer();

    this.printModel = new PrintModel({
      localObserver: this.localObserver,
      app: props.app,
      map: props.map
    });
  }

  onWindowShow = () => {
    this.localObserver.publish("showPrintPreview");
  };

  onWindowHide = () => {
    this.localObserver.publish("hidePrintPreview");
  };

  render() {
    return (
      <BaseWindowPlugin
        {...this.props}
        type="Print"
        custom={{
          icon: <PrintIcon />,
          title: "Skriv ut",
          description: "Skapa en PDF av kartan",
          height: 500,
          width: 250,
          onWindowShow: this.onWindowShow,
          onWindowHide: this.onWindowHide
        }}
      >
        <PrintView
          model={this.printModel}
          app={this.props.app}
          map={this.props.map}
          options={this.props.options}
          localObserver={this.localObserver}
        />
      </BaseWindowPlugin>
    );
  }
}

export default Print;
