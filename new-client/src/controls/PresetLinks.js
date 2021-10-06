import React from "react";
import { createPortal } from "react-dom";
import { withStyles } from "@material-ui/core/styles";
import propTypes from "prop-types";

import { Button, Paper, Tooltip, Menu, MenuItem } from "@material-ui/core";
import Bookmarks from "@material-ui/icons/Bookmarks";

import Dialog from "../components/Dialog.js";

const styles = (theme) => {
  return {
    paper: {
      marginBottom: theme.spacing(1),
    },
    button: {
      minWidth: "unset",
    },
  };
};

class Preset extends React.PureComponent {
  static propTypes = {
    classes: propTypes.object.isRequired,
    appModel: propTypes.object.isRequired,
  };

  state = {
    anchorEl: null,
    dialogOpen: false,
  };

  constructor(props) {
    super(props);
    this.type = "Preset"; // Special case - plugins that don't use BaseWindowPlugin must specify .type here
    this.config = props.appModel.config.mapConfig.tools.find(
      (t) => t.type === "preset"
    );

    this.appModel = props.appModel;
    this.globalObserver = props.appModel.globalObserver;

    // If config wasn't found, it means that Preset is not configured. Quit.
    if (this.config === undefined) return;

    // Else, if we're still here, go on.
    this.options = this.config.options;
    this.map = props.appModel.getMap();
    this.title = this.options.title || "Snabbval";

    this.location = null;
    this.zoom = null;
    this.layers = null;
  }

  // Show dropdown menu, anchored to the element clicked
  handleClick = (event) => {
    this.setState({ anchorEl: event.currentTarget });
  };

  handleClose = () => {
    this.setState({ anchorEl: null });
  };

  // A map-link must contain an x-, y-, and z-position to be valid. This function
  // checks wether that is true or not.
  isValidMapLink = (mapLink) => {
    return (
      mapLink.includes("x=") && mapLink.includes("y=") && mapLink.includes("z=")
    );
  };

  // Extracts map-information from the provided link and returns the
  // information as an object.
  getMapInfoFromMapLink = (mapLink) => {
    const queryParams = new URLSearchParams(mapLink);
    const x = queryParams.get("x");
    const y = queryParams.get("y");
    const z = queryParams.get("z");
    const l = queryParams.get("l");

    const location = [x, y];
    const zoom = z;
    return { location, zoom, layers: l };
  };

  handleItemClick = (event, item) => {
    const url = item.presetUrl.toLowerCase();
    // Let's make sure that the provided url is a valid map-link
    if (this.isValidMapLink(url)) {
      this.handleClose(); // Ensure that popup menu is closed
      const { location, zoom, layers } = this.getMapInfoFromMapLink(url);
      this.location = location;
      this.zoom = zoom;
      this.layers = layers;

      // If the link contains layers we open the dialog where the user can choose to
      // proceed.
      if (layers) {
        this.openDialog();
      } // If the link does not contain layers, we can simply fly to the new location
      // without toggling layers and so on.
      else {
        this.flyTo(this.map.getView(), this.location, this.zoom);
      }
    } // If the provided url is not a valid map-link, warn the user.
    else {
      this.props.enqueueSnackbar(
        "Länken till platsen är tyvärr felaktig. Kontakta administratören av karttjänsten för att åtgärda felet.",
        {
          variant: "warning",
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
    const menuItems = [];
    this.options.presetList.forEach((item, index) => {
      menuItems.push(
        <MenuItem
          key={index}
          onClick={(event) => this.handleItemClick(event, item)}
        >
          {item.name}
        </MenuItem>
      );
    });
    return menuItems;
  };

  flyTo(view, location, zoom) {
    const duration = 1500;
    view.animate({
      center: location,
      zoom: zoom,
      duration: duration,
    });
  }

  openDialog = () => {
    this.setState({
      dialogOpen: true,
    });
  };

  closeDialog = () => {
    const visibleLayers = this.layers.split(",");
    this.setState({
      dialogOpen: false,
    });
    this.toggleMapLayers(visibleLayers);
    this.flyTo(this.map.getView(), this.location, this.zoom);
  };

  abortDialog = () => {
    this.setState({
      dialogOpen: false,
    });
  };

  layerShouldBeVisible = (layer, visibleLayers) => {
    return visibleLayers.some(
      (layerId) => layerId === layer.getProperties()["name"]
    );
  };

  toggleMapLayers = (visibleLayers) => {
    const layerSwitcherLayers = this.map
      .getLayers()
      .getArray()
      .filter((layer) => layer.get("layerInfo"));

    for (const l of layerSwitcherLayers) {
      if (this.layerShouldBeVisible(l, visibleLayers)) {
        this.globalObserver.publish("layerswitcher.showLayer", l);
        l.setVisible(true);
      } else {
        this.globalObserver.publish("layerswitcher.hideLayer", l);
        l.setVisible(false);
      }
    }
  };

  renderDialog() {
    if (this.state.dialogOpen) {
      return createPortal(
        <Dialog
          options={{
            text: "Alla tända lager i kartan kommer nu att släckas. Snabbvalets fördefinierade lager tänds istället.",
            headerText: "Visa snabbval",
            buttonText: "OK",
            abortText: "Avbryt",
          }}
          open={this.state.dialogOpen}
          onClose={this.closeDialog}
          onAbort={this.abortDialog}
        />,
        document.getElementById("windows-container")
      );
    } else {
      return null;
    }
  }

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
          {this.renderDialog()}
        </>
      );
    }
  }
}

export default withStyles(styles)(Preset);
