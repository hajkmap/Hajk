import React, { Component } from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import { ListItem, ListItemIcon, ListItemText } from "@material-ui/core";

const styles = theme => ({});

class ToolbarItem extends Component {
  constructor() {
    super();
    this.state = {
      toggled: false
    };
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
    console.log(`${this.props.text} toggled is:`, this.state.toggled);
    console.log(this);

    this.setState(
      {
        toggled: !this.state.toggled
      },
      () => {
        console.log("After new state", this.state.toggled);
        this.props.toggleCallback(this.state.toggled);
      }
    );
  };

  isToolActive = () => (this.state.toggled ? true : false);

  render() {
    const { icon, text } = this.props;

    return (
      <ListItem button onClick={this.toggle} selected={this.isToolActive()}>
        <ListItemIcon>{icon}</ListItemIcon>
        <ListItemText primary={text} />
      </ListItem>
    );
  }
}

ToolbarItem.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(ToolbarItem);
