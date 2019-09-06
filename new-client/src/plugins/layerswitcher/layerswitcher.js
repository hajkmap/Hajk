import React from "react";
import { createPortal } from "react-dom";
import { withStyles } from "@material-ui/core/styles";
import {
  Hidden,
  ListItem,
  ListItemIcon,
  ListItemText
} from "@material-ui/core";
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

  handleButtonClick = e => {
    this.app.onPanelOpen(this);
    this.setState({
      panelOpen: true
    });
    this.app.globalObserver.publish("hideDrawer");
    this.observer.emit("panelOpen");
  };

  closePanel = () => {
    this.setState({
      panelOpen: false
    });
  };

  constructor(props) {
    console.log("props: ", props);
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

  renderWindow(mode = "window") {
    return (
      <>
        <Window
          globalObserver={this.props.app.globalObserver}
          title={this.title}
          onClose={this.closePanel}
          open={this.state.panelOpen}
          width={400}
          height="auto"
          // top={210}
          // left={5}
          mode={mode}
        >
          <LayerSwitcherView
            app={this.props.app}
            map={this.props.map}
            model={this.layerSwitcherModel}
            observer={this.observer}
            breadCrumbs={this.props.type === "widgetItem"}
          />
        </Window>
        {this.renderDrawerButton()}
        {this.options.target === "left" &&
          this.renderWidgetButton("left-column")}
        {this.options.target === "right" &&
          this.renderWidgetButton("right-column")}
      </>
    );
  }

  /**
   * This is a bit of a special case. This method will render
   * not only plugins specified as Drawer plugins (target===toolbar),
   * but it will also render Widget plugins - given some special condition.
   *
   * Those special conditions are small screens, were there's no screen
   * estate to render the Widget button in Map Overlay.
   */
  renderDrawerButton() {
    return createPortal(
      <Hidden smUp={this.options.target !== "toolbar"}>
        <ListItem
          button
          divider={true}
          selected={this.state.panelOpen}
          onClick={this.handleButtonClick}
        >
          <ListItemIcon>
            <LayersIcon />
          </ListItemIcon>
          <ListItemText primary={this.title} />
        </ListItem>
      </Hidden>,
      document.getElementById("plugin-buttons")
    );
  }

  renderWidgetButton(id) {
    return createPortal(
      // Hide Widget button on small screens, see renderDrawerButton too
      <Hidden xsDown>
        <Card
          icon={<LayersIcon />}
          onClick={this.handleButtonClick}
          title={this.title}
          abstract={this.description}
        />
      </Hidden>,
      document.getElementById(id)
    );
  }

  render() {
    return this.renderWindow();
  }
}

export default withStyles(styles)(LayerSwitcher);
