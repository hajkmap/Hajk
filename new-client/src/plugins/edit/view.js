import React, { Component } from "react";
import Observer from "react-event-observer";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";

import EditModel from "./model.js";
import PanelHeader from "../../components/PanelHeader.js";

import {
  ListItem,
  ListItemIcon,
  ListItemText,
  Drawer
} from "@material-ui/core";
import EditIcon from "@material-ui/icons/Edit";

const styles = theme => ({
  drawerPaper: {
    width: "500px"
  }
});

class Edit extends Component {
  constructor() {
    super();
    this.state = {
      toggled: false
    };
  }

  componentDidMount() {
    this.observer = Observer();
    this.observer.subscribe("myEvent", message => {
      console.log(message);
    });
    this.editModel = new EditModel({
      map: this.props.tool.map,
      app: this.props.tool.app,
      observer: this.observer
    });
    this.props.tool.instance = this;
  }

  open() {
    this.setState({
      toggled: true
    });
  }

  close() {
    this.setState({
      toggled: false
    });
  }

  minimize() {
    this.setState({
      toggled: false
    });
  }

  toggle = () => {
    // if (!this.state.toggled) {
    //   this.props.toolbar.hide();
    // }
    this.setState({
      toggled: !this.state.toggled
    });
    this.props.tool.app.togglePlugin("edit");
  };

  getActiveClass() {
    return this.state.toggled
      ? "tool-toggle-button active"
      : "tool-toggle-button";
  }

  getVisibilityClass() {
    return this.state.toggled
      ? "tool-panel edit-panel"
      : "tool-panel edit-panel hidden";
  }

  renderPanel() {
    const { toggled } = this.state;
    const { classes } = this.props;
    return createPortal(
      <Drawer
        variant="persistent"
        anchor="right"
        open={toggled}
        classes={{ paper: classes.drawerPaper }}
      >
        <PanelHeader title="Redigera" toggle={this.toggle} />
        Redigera
      </Drawer>,

      document.getElementById("map")
    );
  }

  isButtonActive() {
    return this.state.toggled ? "contained" : "text";
  }

  render() {
    return (
      <div>
        <ListItem button onClick={this.toggle}>
          <ListItemIcon>
            <EditIcon />
          </ListItemIcon>
          <ListItemText primary="Redigera" />
        </ListItem>
        {this.renderPanel()}
      </div>
    );
  }
}

Edit.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(Edit);
