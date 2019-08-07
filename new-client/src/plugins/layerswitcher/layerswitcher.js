import React from "react";
import { createPortal } from "react-dom";
import { withStyles } from "@material-ui/core/styles";
import { ListItem, ListItemIcon, ListItemText } from "@material-ui/core";
import LayersIcon from "@material-ui/icons/Layers";
import Window from "../../components/Window.js";
import Card from "../../components/Card.js";
import LayerSwitcherView from "./LayerSwitcherView.js";
import LayerSwitcherModel from "./LayerSwitcherModel.js";
import Observer from "react-event-observer";

const styles = theme => {
  return {};
};

class LayerSwitcher extends React.PureComponent {
  state = {
    panelOpen: this.props.options.visibleAtStart
  };

  onClick = e => {
    this.app.onPanelOpen(this);
    this.setState({
      panelOpen: true,
      revision: Math.round(Math.random() * 1e8)
    });
    this.observer.emit("panelOpen");
  };

  closePanel = () => {
    this.setState({
      panelOpen: false
    });
  };

  constructor(props) {
    super(props);
    this.options = props.options;
    this.app = props.app;
    this.options = props.options;
    this.title = this.options.title || "Visa";
    this.description =
      this.options.description || "Välj vad du vill se i kartan";
    this.observer = Observer();
    this.observer.subscribe("layerAdded", layer => {});
    this.layerSwitcherModel = new LayerSwitcherModel({
      map: props.map,
      app: props.app,
      observer: this.observer
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
        height="auto"
        width={400}
        top={210}
        left={5}
        mode={mode}
      >
        <LayerSwitcherView
          app={this.props.app}
          map={this.props.map}
          model={this.layerSwitcherModel}
          observer={this.observer}
          breadCrumbs={this.props.type === "widgetItem"}
        />
      </Window>,
      document.getElementById("toolbar-panel")
    );
  }

  renderAsWidgetItem() {
    return (
      <div>
        <Card
          icon={<LayersIcon />}
          onClick={this.onClick}
          title={this.title}
          abstract={this.description}
        />
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
            <LayersIcon />
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

export default withStyles(styles)(LayerSwitcher);
