import React, { Component } from "react";
import { createPortal } from "react-dom";
import { withStyles } from "@material-ui/core/styles";
import RateReviewIcon from "@material-ui/icons/RateReview";
import { ListItem, ListItemIcon, ListItemText } from "@material-ui/core";
import Observer from "react-event-observer";
import Window from "../../components/Window.js";
import Card from "../../components/Card.js";
import CollectorView from "./CollectorView.js";
import CollectorModel from "./CollectorModel.js";

const styles = theme => {
  return {};
};
class Collector extends Component {
  constructor(props) {
    super(props);
    this.position = props.options.target;
    this.app = props.app;
    this.options = props.options;
    this.title = this.options.title || "Tyck till";
    this.abstract = this.options.abstract || "Vi vill veta vad du tycker!";
    this.form = this.options.form || [];
    this.visibleAtStart = this.options.visibleAtStart;
    this.state = {
      dialogOpen: false
    };
    this.serviceConfig = this.getLayerConfigById(this.options.serviceId);
    this.observer = new Observer();
    this.collectorModel = new CollectorModel({
      map: props.map,
      app: props.app,
      observer: this.observer,
      globalObserver: this.app.globalObserver,
      options: {
        ...props.options,
        serviceConfig: this.serviceConfig
      }
    });
    this.app.registerPanel(this);
  }

  componentDidMount() {
    if (this.visibleAtStart) {
      this.setState({
        panelOpen: true
      });
    }
  }

  getLayerConfigById(serviceId) {
    return this.app.config.layersConfig.find(
      layerConfig => layerConfig.type === "edit" && layerConfig.id === serviceId
    );
  }

  onClick = e => {
    this.app.onPanelOpen(this);
    this.setState({
      panelOpen: true
    });
  };

  minimizePanel = () => {
    this.setState({
      panelOpen: false
    });
  };

  closePanel = () => {
    this.setState({
      panelOpen: false
    });
    this.collectorModel.reset();
    this.collectorModel.observer.publish("abortInteraction");
  };

  openPanel = () => {
    this.setState({
      panelOpen: true
    });
  };

  renderWindow(mode) {
    var left = this.position === "right" ? (window.innerWidth - 410) / 2 : 0;
    return createPortal(
      <Window
        localObserver={this.observer}
        globalObserver={this.props.app.globalObserver}
        title={this.title}
        onClose={this.closePanel}
        open={this.state.panelOpen}
        position={this.position}
        height={450}
        width={430}
        top={210}
        left={left}
        mode={mode}
      >
        <CollectorView
          onClose={this.closePanel}
          model={this.collectorModel}
          dialogOpen={this.state.panelOpen}
          minimizePanel={this.minimizePanel}
          openPanel={this.openPanel}
          form={this.form}
          serviceConfig={this.serviceConfig}
          options={this.options}
        />
      </Window>,
      document.getElementById("toolbar-panel")
    );
  }

  renderAsWidgetItem() {
    return (
      <div>
        <Card
          icon={<RateReviewIcon />}
          onClick={this.onClick}
          title={this.title}
          abstract={this.abstract}
        />
        {this.renderWindow("window")}
      </div>
    );
  }

  renderAsToolbarItem() {
    this.position = undefined;
    return (
      <div>
        <ListItem
          button
          divider={true}
          selected={this.state.panelOpen}
          onClick={this.onClick}
        >
          <ListItemIcon>
            <RateReviewIcon />
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

export default withStyles(styles)(Collector);
