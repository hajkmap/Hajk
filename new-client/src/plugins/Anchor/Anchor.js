import React from "react";
import propTypes from "prop-types";
import Observer from "react-event-observer";
import BaseWindowPlugin from "../BaseWindowPlugin";

import ShareIcon from "@mui/icons-material/Share";

import AnchorView from "./AnchorView";
import AnchorModel from "./AnchorModel";

class Anchor extends React.PureComponent {
  static propTypes = {
    app: propTypes.object.isRequired,
    map: propTypes.object.isRequired,
    options: propTypes.object.isRequired,
  };

  // cleanUrl is lifted here so that it can be handled in both Model and View
  // We need to grab the valid value on init. Since it's a string and we need a Boolean
  // there are a couple of checks. As a shorthand, we specify the allowed values that
  // will be interpreted as cleanMode === true inside an Array. Any other value of `clean`
  // will be understood as `false`.
  state = {
    cleanUrl: ["", "true", "1"].includes(
      this.props.app.config.initialURLParams.get("clean")
    ),
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
      map: props.map,
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
    this.setState({ cleanUrl: !this.state.cleanUrl }, (d) => {
      this.localObserver.publish("mapUpdated", this.anchorModel.getAnchor());
    });
  };

  render() {
    return (
      <BaseWindowPlugin
        {...this.props}
        type="Anchor"
        custom={{
          icon: <ShareIcon />,
          title: "Dela",
          description: "Skapa en länk och dela det du ser i kartan med andra",
          height: "dynamic",
          width: 512,
          top: undefined,
          left: undefined,
        }}
      >
        <AnchorView
          cleanUrl={this.state.cleanUrl}
          localObserver={this.localObserver}
          model={this.anchorModel}
          options={this.props.options}
          toggleCleanUrl={this.toggleCleanUrl}
        />
      </BaseWindowPlugin>
    );
  }
}

export default Anchor;
