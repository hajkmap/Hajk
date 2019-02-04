import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { ListItem, ListItemIcon, ListItemText } from "@material-ui/core";
import OpenInNewIcon from "@material-ui/icons/OpenInNew";
import AnchorView from "./AnchorView";
import AnchorModel from "./AnchorModel";
import Observer from "react-event-observer";
import PopPanel from "../../components/PopPanel.js";

const styles = theme => {
  return {};
};

class Anchor extends React.PureComponent {
  state = {
    panelOpen: this.props.options.visibleAtStart,
    top: 0
  };

  onClick = e => {
    this.app.onPanelOpen(this);
    this.setState({
      panelOpen: true,
      anchorEl: e.currentTarget
    });
  };

  closePanel = () => {
    this.setState({
      panelOpen: false,
      anchorEl: null
    });
  };

  constructor(props) {
    super(props);
    this.text = "Länk till karta";
    this.app = props.app;
    this.localObserver = Observer();
    this.anchorModel = new AnchorModel({
      map: props.map,
      app: props.app,
      localObserver: this.localObserver
    });
    this.app.registerPanel(this);
  }

  renderPanel() {
    return (
      <PopPanel
        title={this.text}
        onClose={this.closePanel}
        open={this.state.panelOpen}
        anchorEl={this.state.anchorEl}
      >
        <AnchorView
          localObserver={this.localObserver}
          model={this.anchorModel}
          parent={this}
        />
      </PopPanel>
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
            <OpenInNewIcon />
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

export default withStyles(styles)(Anchor);
