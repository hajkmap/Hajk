import React from "react";
import { withStyles } from "@material-ui/core/styles";
import propTypes from "prop-types";

import { Button, Paper, Tooltip, Menu, MenuItem } from "@material-ui/core";
import Bookmarks from "@material-ui/icons/Bookmarks";

const styles = theme => {
  return {
    paper: {
      marginBottom: theme.spacing(1)
    },
    button: {
      minWidth: "unset"
    }
  };
};

class Preset extends React.PureComponent {
  static propTypes = {
    classes: propTypes.object.isRequired,
    appModel: propTypes.object.isRequired
  };

  state = {};

  constructor(props) {
    super(props);
    this.type = "Preset"; // Special case - plugins that don't use BaseWindowPlugin must specify .type here
    this.config = props.appModel.config.mapConfig.tools.find(
      t => t.type === "preset"
    );

    // If config wasn't found, it means that Preset is not configured. Quit.
    if (this.config === undefined) return null;

    // Else, if we're still here, go on.
    this.options = this.config.options;
    this.map = props.appModel.getMap();
    this.title = this.options.title || "Snabbval";
  }

  // Show dropdown menu, anchored to the element clicked
  handleClick = event => {
    this.setState({ anchorEl: event.currentTarget });
  };

  handleClose = () => {
    this.setState({ anchorEl: null });
  };

  handleItemClick = (event, item) => {
    let url = item.presetUrl.toLowerCase();
    if (
      url.indexOf("&x=") > 0 &&
      url.indexOf("&y=") > 0 &&
      url.indexOf("&z=") > 0
    ) {
      this.handleClose(); // Ensure that popup menu is closed
      let url = item.presetUrl.split("&");
      let x = url[1].substring(2);
      let y = url[2].substring(2);
      let z = url[3].substring(2);
      const view = this.map.getView();
      view.animate({
        center: [x, y],
        zoom: z
      });
    } else {
      this.props.enqueueSnackbar(
        "Länken till platsen är tyvärr felaktig. Kontakta administratören av karttjänsten för att åtgärda felet.",
        {
          variant: "warning"
        }
      );
      console.error(
        "Fel i verktyget Snabbval. Länken til : \n" +
          item.name +
          "\n" +
          item.presetUrl +
          "\när tyvärr felaktig. Någon av följande parametrar saknas: &x=, &y=, &z= eller innehåller fel."
      );
    }
  };

  renderMenuItems = () => {
    let menuItems = [];
    this.options.presetList.forEach((item, index) => {
      menuItems.push(
        <MenuItem
          key={index}
          onClick={event => this.handleItemClick(event, item)}
        >
          {item.name}
        </MenuItem>
      );
    });
    return menuItems;
  };

  render() {
    // If config for Control isn't found, or if the config doesn't contain any presets, quit.
    if (
      this.config === undefined ||
      (this.config.hasOwnProperty("options") &&
        this.config.options.presetList.length < 1)
    ) {
      return null;
    } else {
      const { anchorEl } = this.state;
      const { classes } = this.props;
      const open = Boolean(anchorEl);
      return (
        <>
          <Tooltip title={this.title}>
            <Paper className={classes.paper}>
              <Button
                aria-label={this.title}
                className={classes.button}
                onClick={this.handleClick}
              >
                <Bookmarks />
              </Button>
            </Paper>
          </Tooltip>
          <Menu
            id="render-props-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={this.handleClose}
          >
            {this.renderMenuItems()}
          </Menu>
        </>
      );
    }
  }
}

export default withStyles(styles)(Preset);
