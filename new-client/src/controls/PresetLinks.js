import React from "react";
import { createPortal } from "react-dom";
import { styled } from "@mui/material/styles";
import propTypes from "prop-types";
import { withSnackbar } from "notistack";
import { withTranslation } from "react-i18next";

import { IconButton, Paper, Tooltip, Menu, MenuItem } from "@mui/material";
import FolderSpecial from "@mui/icons-material/FolderSpecial";

import Dialog from "../components/Dialog/Dialog";

const StyledPaper = styled(Paper)(({ theme }) => ({
  marginBottom: theme.spacing(1),
}));

const StyledIconButton = styled(IconButton)(() => ({
  minWidth: "unset",
}));

class Preset extends React.PureComponent {
  static propTypes = {
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
      (mapLink.includes("x=") && mapLink.includes("y=")) ||
      mapLink.includes("l=")
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

    const location = x && y ? [x, y] : null;
    const zoom = location ? z : null; // no need to zoom if we don't have a position.
    return { location, zoom, layers: l };
  };

  handleItemClick = (event, item) => {
    const { t } = this.props;
    const url = item.presetUrl.toLowerCase();
    // Let's make sure that the provided url is a valid map-link
    if (this.isValidMapLink(url)) {
      this.handleClose(); // Ensure that popup menu is closed
      const { location, zoom, layers } = this.getMapInfoFromMapLink(url);
      this.location = location;
      this.zoom = location ? zoom || this.map.getView().getZoom() : null;

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
      this.props.enqueueSnackbar(t("controls.presetLinks.error"), {
        variant: "warning",
      });
      console.error(
        "Error in PresetLinks. Link to : \n" +
          item.name +
          "\n" +
          item.presetUrl +
          "\ncontains errors. Required parameters (&x=, &y=, &z=) is missing or contains errors."
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
    if (!location) {
      return;
    }
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
    const { t } = this.props;
    if (this.state.dialogOpen) {
      return createPortal(
        <Dialog
          options={{
            text: t("controls.presetLinks.dialog.text"),
            headerText: t("controls.presetLinks.dialog.header"),
            buttonText: t("common.ok"),
            abortText: t("common.cancel"),
            useLegacyNonMarkdownRenderer: true,
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
      const { t } = this.props;
      const { anchorEl } = this.state;
      const open = Boolean(anchorEl);
      return (
        <>
          <Tooltip
            disableInteractive
            title={this.options.title || t("controls.presetLinks.title")}
          >
            <StyledPaper>
              <StyledIconButton
                aria-label={
                  this.options.title || t("controls.presetLinks.title")
                }
                onClick={this.handleClick}
              >
                <FolderSpecial />
              </StyledIconButton>
            </StyledPaper>
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

export default withTranslation()(withSnackbar(Preset));
