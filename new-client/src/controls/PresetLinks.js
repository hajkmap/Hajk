import React from "react";
import { createPortal } from "react-dom";
import { withStyles } from "@material-ui/core/styles";
import propTypes from "prop-types";

import { Button, Paper, Tooltip, Menu, MenuItem } from "@material-ui/core";
import InfoIcon from "@material-ui/icons/Info";

import Dialog from "../components/Dialog.js";

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
    options: propTypes.object.isRequired
  };

  constructor(props) {
    super(props);
    this.type = "Preset"; // Special case - plugins that don't use BaseWindowPlugin must specify .type here
    this.options = props.options;
    this.title = this.options.title || "Snabbval";
    this.state = {
      dialogOpen: false
    };
  }

  componentDidMount() {
    //let dialogOpen = this.options.visibleAtStart;
    let dialogOpen = true;

    /*     if (this.options.visibleAtStart === true) {
      if (
        this.options.showInfoOnce === true &&
        parseInt(
          window.localStorage.getItem("pluginInformationMessageShown")
        ) === 1
      ) {
        dialogOpen = false;
      } else {
        if (this.options.showInfoOnce === true) {
          window.localStorage.setItem("pluginInformationMessageShown", 1);
        }
        dialogOpen = true;
      }
    } else {
      dialogOpen = false;
    }
 */
    this.setState({
      dialogOpen
    });
  }

  onClose = () => {
    this.setState({
      dialogOpen: false
    });
  };

  // Show dropdown menu, anchored to the element clicked
  handleClick = event => {
    this.setState({ anchorEl: event.currentTarget });
  };

  handleClose = () => {
    this.setState({ anchorEl: null });
  };

  handleOnClick = (event, item) => {
    //const { map } = this.props;
    console.log(item);
    //console.log(this.map);
    let url = item.presetUrl.toLowerCase();
    if (
      url.indexOf("&x=") > 0 &&
      url.indexOf("&y=") > 0 &&
      url.indexOf("&z=") > 0
    ) {
      let url = item.presetUrl.split("&");
      let x = url[1].substring(2);
      let y = url[2].substring(2);
      let z = url[3].substring(2);
      // const view = map.getView();
      // view.animate({
      //   center: [x, y],
      //   zoom: z
      // });
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

  renderDialog() {
    const { headerText, text, buttonText } = this.props.options;

    return createPortal(
      <Dialog
        options={{ headerText, text, buttonText }}
        open={this.state.dialogOpen}
        onClose={this.onClose}
      />,
      document.getElementById("windows-container")
    );
  }

  renderMenuItems = () => {
    let menuItems = [];
    this.options.presetList.forEach((item, index) => {
      menuItems.push(
        <MenuItem
          key={index}
          onClick={event => this.handleOnClick(event, item)}
        >
          {item.name}
        </MenuItem>
      );
    });
    return menuItems;
  };

  render() {
    const { anchorEl } = this.state;
    const { classes } = this.props;
    const open = Boolean(anchorEl);
    return (
      <>
        {/* {this.renderMenuItems()} */}
        <Tooltip title={this.title}>
          <Paper className={classes.paper}>
            <Button
              aria-label={this.title}
              className={classes.button}
              onClick={this.handleClick}
            >
              <InfoIcon />
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

export default withStyles(styles)(Preset);
