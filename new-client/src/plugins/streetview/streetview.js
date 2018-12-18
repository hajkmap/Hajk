import React from "react";
import { createPortal } from "react-dom";
import { withStyles } from "@material-ui/core/styles";
import { ListItem, ListItemIcon, ListItemText } from "@material-ui/core";
import StreetviewIcon from "@material-ui/icons/Streetview";
import StreetViewView from "./StreetViewView";
import StreetViewModel from "./StreetViewModel";
import Observer from "react-event-observer";
import Panel from "../../components/Panel.js";

const styles = theme => {
  return {};
};

class StreetView extends React.PureComponent {
  state = {
    panelOpen: this.props.options.visibleAtStart,
    top: 0
  };

  onClick = e => {
    this.app.onPanelOpen(this);
    this.setState(
      {
        panelOpen: true
      },
      () => this.streetViewModel.activate()
    );
  };

  closePanel = () => {
    this.setState(
      {
        panelOpen: false,
        displayPanorama: false
      },
      () => this.streetViewModel.deactivate()
    );
  };

  constructor(props) {
    super(props);
    this.text = " Street View";
    this.app = props.app;
    this.localObserver = Observer();
    this.streetViewModel = new StreetViewModel({
      map: props.map,
      app: props.app,
      localObserver: this.localObserver,
      apiKey: props.options.apiKey
    });
    this.app.registerPanel(this);
    this.localObserver.on("locationChanged", () => {
      this.setState({
        panelOpen: true,
        displayPanorama: true
      });
    });
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
        <StreetViewView
          localObserver={this.localObserver}
          model={this.streetViewModel}
          parent={this}
          displayPanorama={this.state.displayPanorama}
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
            <StreetviewIcon />
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

export default withStyles(styles)(StreetView);
