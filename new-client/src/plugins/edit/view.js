import React, { Component } from "react";
import Observer from "react-event-observer";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";

import EditModel from "./model.js";
import PanelHeader from "../../components/PanelHeader.js";

import { Drawer } from "@material-ui/core";
import EditIcon from "@material-ui/icons/Edit";

const styles = theme => ({
  drawerPaper: {
    left: "72px",
    width: "500px",
    zIndex: theme.zIndex.drawer - 1
  }
});

class Edit extends Component {
  state = {
    toggled: false
  };

  active = false;

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

  open(message) {
    this.active = true;
    this.setState({
      toggled: true
    });
  }

  close() {
    this.active = false;
    this.setState({
      toggled: false
    });
  }

  minimize() {
    this.active = false;
    this.setState({
      toggled: false
    });
  }

  toggle = () => {
    this.props.tool.app.togglePlugin("edit");
    this.props.onClick();
  };

  renderPanel() {
    const { toggled } = this.state;
    const { classes } = this.props;
    return createPortal(
      <Drawer
        variant="persistent"
        anchor="left"
        open={toggled}
        classes={{ paper: classes.drawerPaper }}
      >
        <PanelHeader title="Redigera" toggle={this.toggle} />
      </Drawer>,
      document.getElementById("map")
    );
  }

  isToolActive = () => this.active;

  render() {
    return (
      <div>
        <EditIcon className={this.props.className}/>
        {this.renderPanel()}
      </div>
    );
  }
}

Edit.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(Edit);
