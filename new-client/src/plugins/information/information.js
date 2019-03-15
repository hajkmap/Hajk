import React, { Component } from "react";
import { createPortal } from "react-dom";
import { withStyles } from "@material-ui/core/styles";
import InfoIcon from "@material-ui/icons/Info";
import Card from "../../components/Card.js";
import { ListItem, ListItemIcon, ListItemText } from "@material-ui/core";

import Dialog from "../../components/Dialog.js";

const styles = theme => {
  return {};
};

class Information extends Component {
  constructor(props) {
    super(props);
    this.options = props.options;
    this.title = this.options.title || "Om kartan";
    this.abstract = this.options.abstract || "Visa mer information";
    this.state = {
      dialogOpen: false
    };
  }

  componentDidMount() {
    let dialogOpen = this.options.visibleAtStart;

    if (this.options.visibleAtStart === true) {
      if (
        this.options.showInfoOnce === true &&
        parseInt(window.localStorage.getItem("alreadyShown")) === 1
      ) {
        dialogOpen = false;
      } else {
        if (this.options.showInfoOnce === true) {
          window.localStorage.setItem("alreadyShown", 1);
        }
        dialogOpen = true;
      }
    } else {
      dialogOpen = false;
    }

    this.setState({
      dialogOpen: dialogOpen
    });
  }

  onClose = () => {
    this.setState({
      dialogOpen: false
    });
  };

  onClick = () => {
    this.setState({
      dialogOpen: true
    });
  };

  renderDialog() {
    return createPortal(
      <Dialog
        options={this.props.options}
        open={this.state.dialogOpen}
        onClose={this.onClose}
      />,
      document.getElementById("map")
    );
  }

  renderAsWidgetItem() {
    const { classes } = this.props;
    return (
      <div>
        <Card
          icon={<InfoIcon />}
          onClick={this.onClick}
          title={this.title}
          abstract={this.abstract}
        />
        {this.renderDialog()}
      </div>
    );
  }

  renderAsToolbarItem() {
    return (
      <div>
        <ListItem button divider={true} selected={false} onClick={this.onClick}>
          <ListItemIcon>
            <InfoIcon />
          </ListItemIcon>
          <ListItemText primary={this.title} />
        </ListItem>
        {this.renderDialog()}
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

export default withStyles(styles)(Information);
