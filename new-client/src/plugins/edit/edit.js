import React from "react";
import { createPortal } from "react-dom";
import { withStyles } from "@material-ui/core/styles";
import { ListItem, ListItemIcon, ListItemText } from "@material-ui/core";
import FormatShapesIcon from "@material-ui/icons/FormatShapes";
import Window from "../../components/Window.js";
import EditView from "./EditView.js";
import EditModel from "./EditModel.js";
import Observer from "react-event-observer";

const styles = theme => {
  return {};
};

class Edit extends React.PureComponent {
  state = {
    panelOpen: this.props.options.visibleAtStart
  };

  onClick = e => {
    this.app.onPanelOpen(this);
    this.setState({
      panelOpen: true
    });
  };

  closePanel = () => {
    this.editModel.deactivate();
    this.setState({
      panelOpen: false
    });
  };

  constructor(props) {
    super(props);
    this.options = props.options;
    this.title = this.options.title || "Redigera";
    this.app = props.app;
    this.observer = Observer();
    this.editModel = new EditModel({
      map: props.map,
      app: props.app,
      observer: this.observer,
      options: props.options
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
        height={window.innerHeight - 380 + "px"}
        width="400px"
        top={145}
        left={5}
        mode={mode}
      >
        <EditView
          app={this.app}
          map={this.map}
          parent={this}
          model={this.editModel}
          observer={this.observer}
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
          onClick={this.onClick}
        >
          <ListItemIcon>
            <FormatShapesIcon />
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

export default withStyles(styles)(Edit);
