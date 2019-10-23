import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";
import { Fab } from "@material-ui/core";
import { ListItem, ListItemIcon, ListItemText } from "@material-ui/core";
import CommentIcon from "@material-ui/icons/Comment";

import { detect } from "detect-browser";

const styles = theme => {
  return {};
};

class Suggest extends Component {
  onClick = e => {
    const goOn = window.confirm("Nu kommer ditt mailprogram öppnas.");
    if (!goOn) return;
    let result = {};
    // TODO: email, as well as subject and body pretext should be grabbed from config
    let email = "some.mail@somewhere.com";
    result["url"] = window.location.href;
    result["browser"] = detect();
    let string = `mailto:${email}?subject=HAJK3%20tips&body=write%20message%20above%20this%20string:%20${JSON.stringify(
      result
    )}`;
    window.location.href = string;
  };

  constructor(props) {
    super(props);
    this.type = "Suggest"; // Special case - plugins that don't use BaseWindowPlugin must specify .type here
    this.options = props.options;
    this.title = this.options.title || "Förbättra";
    this.app = props.app;
  }

  renderAsWidgetItem() {
    const { classes } = this.props;
    return (
      <div>
        <Fab
          aria-label="Lämna synpunkter"
          className={classes.button}
          onClick={this.onClick}
        >
          <CommentIcon />
        </Fab>
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
            <CommentIcon />
          </ListItemIcon>
          <ListItemText primary={this.title} />
        </ListItem>
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

export default withStyles(styles)(Suggest);
