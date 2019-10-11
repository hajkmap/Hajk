import React from "react";
import BaseWindowPlugin from "../BaseWindowPlugin";

import OpenInNewIcon from "@material-ui/icons/OpenInNew";

import AnchorView from "./AnchorView";
import AnchorModel from "./AnchorModel";
import Observer from "react-event-observer";

class Anchor extends React.PureComponent {
  constructor(props) {
    super(props);
    this.options = props.options;
    this.title = this.options.title || "Dela";
    this.app = props.app;

    this.localObserver = Observer();
    this.anchorModel = new AnchorModel({
      map: props.map,
      app: props.app,
      localObserver: this.localObserver
    });
  }

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
          localObserver={this.localObserver}
          model={this.anchorModel}
        />
      </BaseWindowPlugin>
    );
  }
}

export default Anchor;
