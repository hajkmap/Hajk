import React from "react";
import propTypes from "prop-types";
import BaseWindowPlugin from "../BaseWindowPlugin";

import OpenInNewIcon from "@material-ui/icons/OpenInNew";

import AnchorView from "./AnchorView";
import AnchorModel from "./AnchorModel";
import Observer from "react-event-observer";

class Anchor extends React.PureComponent {
  static propTypes = {
    app: propTypes.object.isRequired,
    map: propTypes.object.isRequired,
    options: propTypes.object.isRequired
  };

  // cleanUrl is lifted here so that it can be handled in both Model and View
  state = {
    cleanUrl: false
  };

  constructor(props) {
    super(props);
    this.options = props.options;
    this.title = this.options.title || "Dela";
    this.app = props.app;

    this.localObserver = Observer();
    this.anchorModel = new AnchorModel({
      app: props.app,
      getCleanUrl: this.getCleanUrl,
      localObserver: this.localObserver,
      map: props.map
    });
  }
  /**
   * @summary Used by Model to get current value of the state variable
   *
   * @returns {boolean} @param cleanUrl
   */
  getCleanUrl = () => {
    return this.state.cleanUrl;
  };

  toggleCleanUrl = () => {
    this.setState({ cleanUrl: !this.state.cleanUrl }, d => {
      this.localObserver.publish("mapUpdated", this.anchorModel.getAnchor());
    });
  };

  render() {
    return (
      <BaseWindowPlugin
        {...this.props}
        type="Anchor"
        custom={{
          icon: <OpenInNewIcon />,
          title: "Dela",
          description: "Skapa en länk och dela det du ser i kartan med andra",
          height: 230,
          width: 530,
          top: undefined,
          left: undefined
        }}
      >
        <AnchorView
          cleanUrl={this.state.cleanUrl}
          localObserver={this.localObserver}
          model={this.anchorModel}
          toggleCleanUrl={this.toggleCleanUrl}
        />
      </BaseWindowPlugin>
    );
  }
}

export default Anchor;
