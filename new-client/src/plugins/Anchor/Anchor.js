import React from "react";
import propTypes from "prop-types";
import BaseWindowPlugin from "../BaseWindowPlugin";

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
          globalObserver={this.props.app.globalObserver}
          model={this.props.app.anchorModel}
          options={this.props.options}
          mapConfig={this.props.app.config.mapConfig}
        />
      </BaseWindowPlugin>
    );
  }
}

export default Anchor;
