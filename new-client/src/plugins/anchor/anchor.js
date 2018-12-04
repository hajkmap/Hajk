import React from "react";
import { createPortal } from "react-dom";
import { withStyles } from "@material-ui/core/styles";
import { ListItem, ListItemIcon, ListItemText } from "@material-ui/core";
import { Button } from "@material-ui/core";
import OpenInNewIcon from "@material-ui/icons/OpenInNew";
import AnchorView from "./AnchorView";
import AnchorModel from "./AnchorModel";
import Observer from "react-event-observer";
import PopPanel from "../../components/PopPanel.js";

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
      top: e.currentTarget.offsetTop + "px"
    });
  };

  closePanel = () => {
    this.setState({
      panelOpen: false
    });
  };

  constructor(props) {
    super(props);
    this.text = "Länk till karta";
    this.app = props.app;
    this.localObserver = Observer();
    this.dummyModel = new AnchorModel({
      map: props.map,
      app: props.app,
      localObserver: this.localObserver
    });
    this.app.registerPanel(this);
  }

  renderPanel() {
    return createPortal(
      <PopPanel
        title={this.text}
        onClose={this.closePanel}
        position="left"
        open={this.state.panelOpen}
        top={this.state.top}
        height="320px"
      >
        <AnchorView
          localObserver={this.localObserver}
          model={this.dummyModel}
        />
      </PopPanel>,
      document.getElementById("map-overlay")
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
          <ListItemText primary={this.text} />
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
