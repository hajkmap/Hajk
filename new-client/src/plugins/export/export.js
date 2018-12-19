import React from "react";
import { createPortal } from "react-dom";
import { withStyles } from "@material-ui/core/styles";
import { ListItem, ListItemIcon, ListItemText } from "@material-ui/core";
import PrintIcon from "@material-ui/icons/Print";
import ExportView from "./ExportView";
import ExportModel from "./ExportModel";
import Observer from "react-event-observer";
import Panel from "../../components/Panel.js";

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
    this.text = "Exportera karta";
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

  renderPanel() {
    return createPortal(
      <Panel
        title={this.text}
        onClose={this.closePanel}
        position="left"
        open={this.state.panelOpen}
        top={this.state.top}
        height="325px"
      >
        <ExportView
          localObserver={this.localObserver}
          model={this.exportModel}
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
            <PrintIcon />
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

export default withStyles(styles)(Export);
