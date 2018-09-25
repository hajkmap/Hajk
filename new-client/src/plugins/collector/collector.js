import React, { Component } from "react";
import { createPortal } from "react-dom";
import { withStyles } from "@material-ui/core/styles";
import { Button } from "@material-ui/core";
import RateReviewIcon from "@material-ui/icons/RateReview";
import { ListItem, ListItemIcon, ListItemText } from "@material-ui/core";
import Observer from "react-event-observer";

import CollectorView from './CollectorView.js';
import CollectorModel from "./CollectorModel.js";

const styles = theme => {
  return {
    button: {
      width: '50px',
      height: '50px',
      outline: 'none',
      marginBottom: '10px'
    }
  }
};

class Collector extends Component {
  constructor(props) {
    super(props);
    this.text = "Infomation";
    this.state = {
      dialogOpen: false
    };
    this.observer = new Observer();
    this.collectorModel = new CollectorModel({
      map: props.map,
      app: props.app,
      observer: this.observer,
      options: props.options
    });
  }

  componentWillMount() {
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
      <CollectorView onClose={this.onClose}  model={this.collectorModel} dialogOpen={this.state.dialogOpen}></CollectorView>,
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
          <RateReviewIcon />
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
            <RateReviewIcon />
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

export default withStyles(styles)(Collector);
