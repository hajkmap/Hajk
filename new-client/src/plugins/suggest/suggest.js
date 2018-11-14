import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";
import { Button } from "@material-ui/core";
import { ListItem, ListItemIcon, ListItemText } from "@material-ui/core";
import CommentIcon from "@material-ui/icons/Comment";

import { detect } from "detect-browser";

const styles = theme => {
  return {};
};

class Suggest extends Component {
  onClick = e => {
    window.alert("Nu kommer ditt mailprogram öppnas.");
    let result = {};
    // TODO: email, as well as subject and body pretext should be grabbed from config
    let email = "some.mail@somewhere.com";
    result["url"] = window.location.href;
    result["browser"] = detect();
    let string = `mailto:${email}?subject=HAJK3%20tips&body=write%20message%20above%20this%20string:%20${JSON.stringify(
      result
    )}`;
    console.log(result, string);
    window.location.href = string;
  };

  constructor(spec) {
    super(spec);
    this.text = "Redigera";
    this.app = spec.app;
  }

  renderAsWidgetItem() {
    const { classes } = this.props;
    return (
      <div>
        <Button
          variant="fab"
          color="default"
          aria-label="Lämna synpunkter"
          className={classes.button}
          onClick={this.onClick}
        >
          <CommentIcon />
        </Button>
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
          <ListItemText primary={this.text} />
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
