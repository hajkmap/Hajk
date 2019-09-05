import React from "react";
import { createPortal } from "react-dom";
import { withStyles } from "@material-ui/core/styles";
import { ListItem, ListItemIcon, ListItemText } from "@material-ui/core";
import PrintIcon from "@material-ui/icons/Print";
import ExportView from "./ExportView";
import ExportModel from "./ExportModel";
import Observer from "react-event-observer";
import Window from "../../components/Window.js";

const styles = theme => {
  return {};
};

class Export extends React.PureComponent {
  state = {
    panelOpen: this.props.options.visibleAtStart
  };

  onClick = e => {
    this.app.onPanelOpen(this);
    this.exportModel.displayPreview = true;
    this.setState({
      panelOpen: true
    });
  };

  closePanel = () => {
    this.exportModel.displayPreview = false;
    this.setState({
      panelOpen: false
    });
  };

  constructor(props) {
    super(props);
    this.options = props.options;
    this.title = this.options.title || "Exportera";
    this.app = props.app;
    this.localObserver = Observer();
    this.exportModel = new ExportModel({
      map: props.map,
      app: props.app,
      options: props.options,
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
        height={window.innerHeight - 380 + "px"}
        width="400px"
        top={145}
        left={5}
        mode={mode}
      >
        <ExportView
          localObserver={this.localObserver}
          model={this.exportModel}
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
            <PrintIcon />
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

export default withStyles(styles)(Export);
