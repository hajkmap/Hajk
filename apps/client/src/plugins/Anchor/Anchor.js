import React from "react";
import propTypes from "prop-types";
import DialogWindowPlugin from "../DialogWindowPlugin";

import ShareIcon from "@mui/icons-material/Share";

import AnchorView from "./AnchorView";

class Anchor extends React.PureComponent {
  static propTypes = {
    app: propTypes.object.isRequired,
    map: propTypes.object.isRequired,
    options: propTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    this.title = this.props.options.title || "Dela";
  }

  render() {
    return (
      <DialogWindowPlugin
        options={this.props.options}
        map={this.props.map}
        app={this.props.app}
        type="Anchor"
        defaults={{
          icon: <ShareIcon />,
          title: this.title,
          description:
            "Skapa en länk med kartans synliga lager, aktuella zoomnivå och utbredning",
          headerText: "Dela",
          abortText: "Stäng",
          onAbort: this.onAbort,
        }}
      >
        <AnchorView
          globalObserver={this.props.app.globalObserver}
          model={this.props.app.anchorModel}
          options={this.props.options}
          enableAppStateInHash={
            this.props.app?.config?.mapConfig?.map?.enableAppStateInHash
          }
        />
      </DialogWindowPlugin>
    );
  }
}

export default Anchor;
