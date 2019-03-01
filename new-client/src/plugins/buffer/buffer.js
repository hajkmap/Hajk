import React from "react";
import { createPortal } from "react-dom";
import { withStyles } from "@material-ui/core/styles";
import { Button } from "@material-ui/core";
import { ListItem, ListItemIcon, ListItemText } from "@material-ui/core";
import BufferIcon from "@material-ui/icons/Adjust";
import BufferView from "./BufferView.js";
import BufferModel from "./BufferModel.js";
import Observer from "react-event-observer";
import Window from "../../components/Window.js";
import { isMobile } from "../../utils/IsMobile.js";

const styles = theme => {
  return {};
};

class buffer extends React.PureComponent {
  state = {
    panelOpen: this.props.options.visibleAtStart
  };
  onClick = e => {
    this.app.onPanelOpen(this);
    this.setState({
      panelOpen: true
    });
    this.BufferModel.setActive(true);
  };

  closePanel = () => {
    this.setState({
      panelOpen: false
    });
    this.BufferModel.setActive(false);
  };

  constructor(props) {
    super(props);
    this.options = props.options;
    this.title = this.options.title || "Buffra";
    this.app = props.app;
    this.localObserver = Observer();

    this.BufferModel = new BufferModel({
      map: props.map,
      app: props.app,
      localObserver: this.localObserver
    });

    this.app.registerPanel(this);
  }

  renderWindow(mode) {
    return createPortal(
      <Window
        globalObserver={this.props.app.globalObserver}
        title={this.title}
        onClose={this.closePanel}
        open={this.state.panelOpen}
        position={this.position}
        height={450}
        width={400}
        top={210}
        left={0}
        mode={mode}
      >
        <BufferView
          localObserver={this.localObserver}
          model={this.BufferModel}
          app={this.app}
        />
      </Window>,
      document.getElementById(isMobile ? "app" : "toolbar-panel")
    );
  }

  renderAsWidgetItem() {
    const { classes } = this.props;
    return (
      <div>
        <Button
          variant="fab"
          color="default"
          aria-label="Skapa buffertzon"
          className={classes.button}
          onClick={this.onClick}
        >
          <BufferIcon />
        </Button>
        {this.renderWindow("window")}
      </div>
    );
  }

  renderAsToolbarItem() {
    return (
      <div>
        <ListItem
          button
          divider={true}
          selected={this.state.panelOpen}
          onClick={this.onClick}
        >
          <ListItemIcon>
            <BufferIcon />
          </ListItemIcon>
          <ListItemText primary={this.title} />
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
export default withStyles(styles)(buffer);
