import React from "react";
import { createPortal } from "react-dom";
import { withStyles } from "@material-ui/core/styles";
import { ListItem, ListItemIcon, ListItemText } from "@material-ui/core";
import DrawIcon from "@material-ui/icons/Edit";
import DrawView from "./DrawView";
import DrawModel from "./DrawModel";
import Observer from "react-event-observer";
import Panel from "../../components/Panel.js";
import "./draw.css";

const styles = theme => {
  return {};
};

class Draw extends React.PureComponent {
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
    this.drawModel.setActive(true);
  };

  closePanel = () => {
    this.setState({
      panelOpen: false
    });
    this.drawModel.setActive(false);
  };

  constructor(props) {
    super(props);
    this.text = "Ritverktyg";
    this.app = props.app;
    this.localObserver = Observer();
    this.drawModel = new DrawModel({
      map: props.map,
      app: props.app,
      options: props.options,
      localObserver: this.localObserver
    });
    this.app.registerPanel(this);
  }

  renderPanel() {
    return createPortal(
      <Panel
        title={this.text}
        onClose={this.closePanel}
        position="left"
        open={this.state.panelOpen}
        top={this.state.top}
        height="500px"
      >
        <DrawView
          localObserver={this.localObserver}
          model={this.drawModel}
          parent={this}
        />
      </Panel>,
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
            <DrawIcon />
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

export default withStyles(styles)(Draw);
