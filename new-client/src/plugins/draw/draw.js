import React from "react";
import { createPortal } from "react-dom";
import { withStyles } from "@material-ui/core/styles";
import { ListItem, ListItemIcon, ListItemText } from "@material-ui/core";
import DrawIcon from "@material-ui/icons/Edit";
import DrawView from "./DrawView";
import DrawModel from "./DrawModel";
import Observer from "react-event-observer";
import Window from "../../components/Window.js";
import "./draw.css";
import { isMobile } from "../../utils/IsMobile.js";

const styles = theme => {
  return {};
};

class Draw extends React.PureComponent {
  state = {
    panelOpen: this.props.options.visibleAtStart
  };

  onClick = e => {
    this.app.onPanelOpen(this);
    this.setState({
      panelOpen: true
    });
    this.drawModel.setActive(true);
    this.drawModel.setDrawMethod();
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
    this.title = "Rita";
  }

  renderWindow(mode) {
    return createPortal(
      <Window
        globalObserver={this.props.app.globalObserver}
        title={this.title}
        onClose={this.closePanel}
        open={this.state.panelOpen}
        height={window.innerHeight - 380 + "px"}
        width="400px"
        top={145}
        left={5}
        mode={mode}
      >
        <DrawView
          localObserver={this.localObserver}
          model={this.drawModel}
          parent={this}
          open={this.state.panelOpen}
        />
      </Window>,
      document.getElementById(isMobile ? "app" : "toolbar-panel")
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
        {this.renderWindow("panel")}
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
