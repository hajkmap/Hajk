import React from "react";
import { createPortal } from "react-dom";
import { withStyles } from "@material-ui/core/styles";
import { ListItem, ListItemIcon, ListItemText } from "@material-ui/core";
import NavigationIcon from "@material-ui/icons/Navigation";
import Window from "../../components/Window.js";
import Card from "../../components/Card.js";
import LocationView from "./LocationView";

const styles = theme => ({});

class Location extends React.PureComponent {
  state = {
    panelOpen: this.props.options.visibleAtStart
  };

  constructor(props) {
    super(props);
    this.type = "location";
    this.options = props.options;
    this.title = this.options.title || "Positionera";
    this.abstract = this.options.abstract || "Visa min position i kartan";
    this.position = props.options.panel ? props.options.panel : undefined;
    this.app = props.app;
    this.app.registerPanel(this);
  }

  // Called when plugin's <ListItem> or widget <Button> is clicked
  onClick = e => {
    // Callback that loops through app's panels and calls closePanel() on all except current
    this.props.app.onPanelOpen(this);

    // This state variable is being watched for in render() and decides whether MUI Component <Drawer> is open or not
    this.setState({
      panelOpen: true
    });
  };

  // Important, part of API for plugins that contain panels.
  closePanel = () => {
    this.setState({
      panelOpen: false
    });
  };

  // Note: as we experiment with PureComponents, this has been out-commented.
  // Important, part of API. Avoid re-rendering if current panel has not changed its state.
  // shouldComponentUpdate(nextProps, nextState) {
  //   return this.state.panelOpen !== nextState.panelOpen;
  // }

  // Not part of API but rather convention. If plugin has a panel, its render method should be called renderPanel().
  renderWindow(mode) {
    const left = this.position === "right" ? (window.innerWidth - 410) / 2 : 5;
    return createPortal(
      <Window
        globalObserver={this.props.app.globalObserver}
        title={this.title}
        onClose={this.closePanel}
        open={this.state.panelOpen}
        height={420}
        width={300}
        top={210}
        left={left}
        mode={mode}
      >
        <LocationView parent={this} />
      </Window>,
      document.getElementById("windows-container")
    );
  }

  renderAsWidgetItem() {
    return (
      <div>
        <Card
          icon={<NavigationIcon />}
          onClick={this.onClick}
          title={this.title}
          abstract={this.abstract}
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
            <NavigationIcon />
          </ListItemIcon>
          <ListItemText primary={this.title} />
        </ListItem>
        {this.renderWindow("window")}
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

export default withStyles(styles)(Location);
