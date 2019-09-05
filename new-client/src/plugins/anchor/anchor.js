import React from "react";
import { createPortal } from "react-dom";
import { withStyles } from "@material-ui/core/styles";
import { ListItem, ListItemIcon, ListItemText } from "@material-ui/core";
import OpenInNewIcon from "@material-ui/icons/OpenInNew";
import AnchorView from "./AnchorView";
import AnchorModel from "./AnchorModel";
import Observer from "react-event-observer";
import Window from "../../components/Window.js";

const styles = theme => {
  return {};
};

class Anchor extends React.PureComponent {
  state = {
    panelOpen: this.props.options.visibleAtStart,
    top: 0
  };

  onClick = e => {
    this.app.onPanelOpen(this);
    this.setState({
      panelOpen: true,
      anchorEl: e.currentTarget
    });
  };

  closePanel = () => {
    this.setState({
      panelOpen: false,
      anchorEl: null
    });
  };

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
    this.app.registerPanel(this);
  }
  renderPanel() {
    return createPortal(
      <Window
        globalObserver={this.props.app.globalObserver}
        title={this.title}
        onClose={this.closePanel}
        open={this.state.panelOpen}
        position={this.position}
        height={350}
        width={200}
        top={210}
        left={10}
        mode="window"
      >
        <AnchorView
          localObserver={this.localObserver}
          model={this.anchorModel}
          parent={this}
        />
      </Window>,
      document.getElementById("windows-container")
    );
  }

  renderAsWidgetItem() {
    throw new Error("Not implemented exception");
  }

  renderAsToolbarItem() {
    return (
      <div>
        <ListItem
          button
          divider={true}
          selected={this.state.panelOpen}
          onClick={e => {
            e.preventDefault();
            this.onClick(e);
          }}
        >
          <ListItemIcon>
            <OpenInNewIcon />
          </ListItemIcon>
          <ListItemText primary={this.title} />
        </ListItem>
        {this.renderPanel()}
      </div>
    );
  }

  render() {
    if (this.props.type === "toolbarItem") {
      return this.renderAsToolbarItem();
    }

    if (this.props.type === "widgetItem") {
      return this.renderAsWidgetItem();
    }

    return null;
  }
}

export default withStyles(styles)(Anchor);
