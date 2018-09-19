import Dialog from '../../components/Dialog.js';
import React, { Component } from "react";
import { createPortal } from "react-dom";
import { withStyles } from "@material-ui/core/styles";
import { Button } from "@material-ui/core";
import InfoIcon from "@material-ui/icons/Info";
import { ListItem, ListItemIcon, ListItemText } from "@material-ui/core";

const styles = theme => {
  return {
    button: {
      width: '50px',
      height: '50px',
      marginBottom: '5px',
      outline: 'none'
    }
  }
};

class Infomation extends Component {
  constructor(spec) {
    super(spec);
    this.text = "Infomation";
    this.state = {
      dialogOpen: false
    };
  }

  componentWillMount() {
    this.setState({
      dialogOpen: this.props.options.visibleAtStart
    });
  }

  componentWillUnmount() {
    console.log("I will unmount..");
  }

  componentsDidMount() {
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
      ></Dialog>,
      document.getElementById("map")
    );
  }

  renderAsWidgetItem() {
    const {classes} = this.props;
    return (
      <div>
        <Button
          variant="fab"
          color="default"
          aria-label="Infomation"
          className={classes.button}
          onClick={this.onClick}
        >
          <InfoIcon />
        </Button>
        {this.renderDialog()}
      </div>
    );
  }

  renderAsToolbarItem() {
    return (
      <div>
        <ListItem
          button
          divider={true}
          selected={false}
          onClick={this.onClick}
        >
          <ListItemIcon>
            <InfoIcon />
          </ListItemIcon>
          <ListItemText primary={this.text} />
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

export default withStyles(styles)(Infomation);
