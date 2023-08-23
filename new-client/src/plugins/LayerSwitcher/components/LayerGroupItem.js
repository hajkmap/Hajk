import React, { Component } from "react";
import PropTypes from "prop-types";
import { Button, Tooltip, Typography, Grid, Box } from "@mui/material";
import { styled } from "@mui/material/styles";
import { withSnackbar } from "notistack";
import IconWarning from "@mui/icons-material/Warning";
import CallMadeIcon from "@mui/icons-material/CallMade";
import InfoIcon from "@mui/icons-material/Info";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import CloseIcon from "@mui/icons-material/Close";
import LayerSettings from "./LayerSettings.js";
import DownloadLink from "./DownloadLink";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

const ExpandButtonWrapper = styled("div")(() => ({
  display: "flex",
  float: "left",
  cursor: "pointer",
}));

const LayerInfo = styled("div")(({ theme }) => ({
  width: "100%",
  borderBottom: `${theme.spacing(0.2)} solid ${theme.palette.divider}`,
}));

const LayerSummaryContainer = styled((props) => (
  <Grid
    justifyContent="space-between"
    container
    alignItems="center"
    wrap="nowrap"
    {...props}
  />
))(({ theme }) => ({
  width: "100%",
}));

const SummaryButtonsContainer = styled("div")(() => ({
  display: "flex",
  alignItems: "center",
}));

const SummaryButtonWrapper = styled("div")(() => ({
  display: "flex",
  alignItems: "center",
  width: 35,
  height: 35,
  cursor: "pointer",
}));

const Caption = styled(Typography)(({ theme }) => ({
  cursor: "pointer",
  fontSize: theme.typography.pxToRem(15),
}));

const CheckBoxWrapper = styled("div")(() => ({
  display: "flex",
  alignItems: "center",
  cursor: "pointer",
  float: "left",
  marginRight: "5px",
}));

const LegendImage = styled("img")(({ theme }) => ({
  marginLeft: theme.spacing(0.4),
  maxWidth: "250px",
}));

const LegendIcon = styled("img")(({ theme }) => ({
  width: theme.typography.pxToRem(18),
  height: theme.typography.pxToRem(18),
  marginRight: "5px",
}));

const InfoTextContainer = styled("div")(() => ({
  margin: "10px 45px",
}));

const StyledList = styled("ul")(() => ({
  padding: 0,
  margin: 0,
  listStyle: "none",
}));

class LayerGroupItem extends Component {
  static propTypes = {
    options: PropTypes.object,
    layer: PropTypes.object.isRequired,
    cqlFilterVisible: PropTypes.bool,
    model: PropTypes.object.isRequired,
    observer: PropTypes.object,
    chapters: PropTypes.array,
  };

  constructor(props) {
    super(props);
    const { layer } = props;
    const layerInfo = props.layer.get("layerInfo");
    this.state = {
      subLayers: props.layer.subLayers,
      caption: layerInfo.caption,
      visible: props.layer.get("visible"),
      // If layer is to be shown, check if there are some specified sublayers (if yes, we'll
      // enable only those). Else, let's default to showing all sublayers, or finally fallback
      // to an empty array.
      visibleSubLayers: props.layer.get("visible")
        ? props.layer.visibleAtStartSubLayers?.length > 0
          ? props.layer.visibleAtStartSubLayers
          : props.layer.subLayers
        : [],
      expanded: false,
      name: props.layer.get("name"),
      legend: layerInfo.legend,
      status: "ok",
      infoVisible: false,
      infoTitle: layerInfo.infoTitle,
      infoText: layerInfo.infoText,
      infoUrl: layerInfo.infoUrl,
      infoUrlText: layerInfo.infoUrlText,
      infoOwner: layerInfo.infoOwner,
      infoExpanded: false,
      instruction: layerInfo.instruction,
      open: false,
      opacityValue: 1,
      toggleSettings: false,
      toggleSubLayerSettings: {},
    };
    this.toggleSubLayerSettings = this.toggleSubLayerSettings.bind(this);
    this.renderSubLayer = this.renderSubLayer.bind(this);

    this.hideExpandArrow = layerInfo?.hideExpandArrow === true ? true : false;
    // Check if the layer uses min and max zoom levels.
    this.usesMinMaxZoom = this.layerUsesMinMaxZoom();
    // Get the minMaxZoomAlertOnToggleOnly property from the layer.
    this.minMaxZoomAlertOnToggleOnly = layer.get("minMaxZoomAlertOnToggleOnly");
  }
  /**
   * Triggered when the component is successfully mounted into the DOM.
   * @instance
   */
  componentDidMount() {
    const { model } = this.props;
    model.globalObserver.subscribe("layerswitcher.hideLayer", this.setHidden);
    model.globalObserver.subscribe("layerswitcher.showLayer", this.setVisible);
    model.observer.subscribe("hideLayer", this.setHidden);
    model.observer.subscribe("showLayer", this.setVisible);
    model.observer.subscribe("toggleGroup", this.toggleGroupVisible);

    // Listen for changes in the layer's visibility.
    this.props.layer.on?.("change:visible", (e) => {
      // Update the 'visible' state based on the layer's new visibility.
      const visible = !e.oldValue;
      this.setState({
        visible,
      });

      // Listen to zoom changes if the layer is visible.
      this.listenToZoomChange(visible);
    });

    // Initially listen to zoom changes if the layer is visible.
    this.listenToZoomChange(this.state.visible);

    // Set load status by subscribing to a global event. Expect ID (int) of layer
    // and status (string "ok"|"loaderror"). Also, once status was set to "loaderror",
    // don't change it back to "ok": we'll get a response for each tile, so most of
    // the tiles might be "ok", but if only one of the tiles has "loaderror", we
    // consider that the layer has failed loading and want to inform the user.
    model.globalObserver.subscribe("layerswitcher.wmsLayerLoadStatus", (d) => {
      this.state.status !== "loaderror" &&
        this.state.name === d.id &&
        this.setState({
          status: d.status,
        });
    });
  }

  /**
   * Determines if the layer has minimum and maximum zoom level restrictions.
   *
   * This function checks the layer properties to see if the layer has minimum and/or maximum
   * zoom levels defined. If either minZoom or maxZoom is within the valid range (0 to Infinity),
   * the function returns true, indicating that the layer has zoom restrictions.
   *
   * Example: If the layer has minZoom = 5 and maxZoom = 10, it will only be visible
   * when the map's zoom level is between 5 and 10.
   *
   * @returns {boolean} - True if the layer has zoom restrictions, false otherwise.
   */
  layerUsesMinMaxZoom() {
    // Retrieve the layer properties from the layer object.
    const lprops = this.props.layer.getProperties();

    // Get the maxZoom and minZoom properties if they exist, otherwise set them to 0.
    const maxZ = lprops.maxZoom ?? 0;
    const minZ = lprops.minZoom ?? 0;

    // Check if either minZoom or maxZoom is within a valid range (0 < value < Infinity).
    // Return true if any of them are within the valid range, otherwise return false.
    return (maxZ > 0 && maxZ < Infinity) || (minZ > 0 && minZ < Infinity);
  }

  /**
   * Handles the zoom end event to check if the layer should be visible at the current zoom level.
   *
   * This function is triggered when the map's zoom level changes. It checks if the layer's
   * visibility is within the specified minZoom and maxZoom range. If the layer is not visible
   * at the current zoom level and the conditions to show a Snackbar message are met, it calls
   * the showZoomSnack() function to display a message. The function also updates the
   * state.zoomVisible property accordingly.
   *
   * @param {Object} e - The event object (optional).
   * @returns {boolean} - True if the layer is visible at the current zoom level, false otherwise.
   */
  zoomEndHandler = (e) => {
    // Get the current map zoom level.
    const zoom = this.props.model.olMap.getView().getZoom();
    // Retrieve the layer properties.
    const lprops = this.props.layer.getProperties();
    // Check if the current zoom level is within the allowed range of minZoom and maxZoom.
    const layerIsZoomVisible = zoom > lprops.minZoom && zoom <= lprops.maxZoom;

    let showSnack = false;

    // Determine if the Snackbar message should be shown based on the layer visibility and zoom level conditions.
    if (this.minMaxZoomAlertOnToggleOnly === true) {
      if (!this.state.visible && !layerIsZoomVisible && e?.type === "click") {
        showSnack = true;
      }
    } else {
      if (
        !layerIsZoomVisible &&
        (this.state.zoomVisible || !this.state.visible)
      ) {
        showSnack = true;
      }
    }

    // If the Snackbar message should be shown, call the showZoomSnack function.
    if (showSnack === true) {
      this.showZoomSnack();
    }

    // Update the state with the new value for zoomVisible.
    this.setState({
      zoomVisible: layerIsZoomVisible,
    });
    return layerIsZoomVisible;
  };

  /**
   * Subscribes or unsubscribes to the zoom end event based on the provided parameter.
   *
   * This function either subscribes or unsubscribes the zoomEndHandler() function to the
   * 'core.zoomEnd' event, depending on the value of the bListen parameter. If the layer
   * doesn't have any zoom restrictions, the function returns without doing anything.
   *
   * Example: If the layer is visible, subscribe to the map's "moveend" event to listen for
   * zoom changes; if it's not visible, unsubscribe from the event.
   *
   * @param {boolean} bListen - If true, subscribes to the zoom end event; if false, unsubscribes.
   */
  listenToZoomChange(bListen) {
    const { model } = this.props;

    // If the layer doesn't use minZoom and maxZoom properties, return without doing anything.
    if (!this.usesMinMaxZoom) return;

    // Define the event name for zoom change events.
    const eventName = "core.zoomEnd";

    // Subscribe or unsubscribe to the zoom change event based on the 'bListen' parameter.
    if (bListen && !this.zoomEndListener) {
      this.zoomEndListener = model.globalObserver.subscribe(
        eventName,
        this.zoomEndHandler
      );
    } else {
      if (this.zoomEndListener) {
        model.globalObserver.unsubscribe(eventName, this.zoomEndListener);
        this.zoomEndListener = null;
      }
    }
  }

  /**
   * Render the load information component.
   * @instance
   * @return {external:ReactElement}
   */
  renderStatus() {
    return (
      this.state.status === "loaderror" && (
        <Tooltip
          disableInteractive
          title="Lagret kunde inte laddas in. Kartservern svarar inte."
        >
          <SummaryButtonWrapper>
            <IconWarning />
          </SummaryButtonWrapper>
        </Tooltip>
      )
    );
  }

  renderLegendImage() {
    const src =
      this.state.legend[0] && this.state.legend[0].url
        ? this.state.legend[0].url
        : "";
    return src ? <img width="60" alt="legend" src={src} /> : null;
  }

  openInformative = (chapter) => (e) => {
    this.props.onOpenChapter(chapter);
  };

  findChapters(id, chapters) {
    var result = [];
    if (Array.isArray(chapters)) {
      result = chapters.reduce((chaptersWithLayer, chapter) => {
        if (Array.isArray(chapter.layers)) {
          if (chapter.layers.some((layerId) => layerId === id)) {
            chaptersWithLayer = [...chaptersWithLayer, chapter];
          }
          if (chapter.chapters.length > 0) {
            chaptersWithLayer = [
              ...chaptersWithLayer,
              ...this.findChapters(id, chapter.chapters),
            ];
          }
        }
        return chaptersWithLayer;
      }, []);
    }
    return result;
  }

  renderChapterLinks(chapters) {
    if (chapters && chapters.length > 0) {
      const chaptersWithLayer = this.findChapters(
        this.props.layer.get("name"),
        chapters
      );
      if (chaptersWithLayer.length > 0) {
        return (
          <InfoTextContainer>
            <Typography>
              Innehåll från denna kategori finns benämnt i följande kapitel i
              översiktsplanen:
            </Typography>
            <StyledList>
              {chaptersWithLayer.map((chapter, i) => {
                return (
                  <li key={i}>
                    <Button
                      size="small"
                      onClick={this.openInformative(chapter)}
                    >
                      {chapter.header}
                      <CallMadeIcon sx={{ marginLeft: 1, fontSize: "16px" }} />
                    </Button>
                  </li>
                );
              })}
            </StyledList>
          </InfoTextContainer>
        );
      } else {
        return null;
      }
    } else {
      return null;
    }
  }

  toggle() {
    this.setState({
      open: !this.state.open,
    });
  }

  toggleInfo() {
    this.setState({
      infoVisible: !this.state.infoVisible,
    });
  }

  isInfoEmpty() {
    const chaptersWithLayer = this.findChapters(
      this.props.layer.get("name"),
      this.props.chapters
    );
    const { infoCaption, infoUrl, infoOwner, infoText } = this.state;
    return !(
      infoCaption ||
      infoUrl ||
      infoOwner ||
      infoText ||
      chaptersWithLayer.length > 0
    );
  }

  setHidden = (l) => {
    const { layer } = this.props;

    if (l.get("name") === layer.get("name")) {
      // Fix underlying source
      this.props.layer.getSource().updateParams({
        // Ensure that the list of sublayers is emptied (otherwise they'd be
        // "remembered" the next time user toggles group)
        LAYERS: "",
        // Remove any filters
        CQL_FILTER: null,
      });

      // Hide the layer in OL
      layer.setVisible(false);

      // Close any existing zoom warning Snackbars.
      this.props.closeSnackbar(this.zoomWarningSnack);

      // Update UI state
      this.setState({
        visible: false,
        visibleSubLayers: [],
      });
    }
  };

  setVisible = (la, subLayer) => {
    let l,
      subLayersToShow = null;

    // If the incoming parameter is an object that contains additional subLayersToShow,
    // let's filter out the necessary objects from it
    if (la.hasOwnProperty("layer") && la.hasOwnProperty("subLayersToShow")) {
      subLayersToShow = la.subLayersToShow;
      l = la.layer;
    } else {
      // In this case the incoming parameter is the actual OL Layer and there is
      // no need to further filter. Just set subLayers to everything that's in this
      // layer, and the incoming object itself as the working 'l' variable.
      subLayersToShow = this.props.layer.subLayers;
      l = la;
    }

    // Now we can be sure that we have the working 'l' variable and can compare
    // it to the 'layer' object in current props. Note that this is necessary, as
    // every single LayerGroupItem is subscribing to the event that calls this method,
    // so without this check we'd end up running this for every LayerGroupItem, which
    // is not intended.
    if (l === this.props.layer) {
      // Show the OL layer
      this.props.layer.setVisible(true);

      // Set LAYERS and STYLES so that the exact sublayers that are needed
      // will be visible
      this.props.layer.getSource().updateParams({
        // join(), so we always provide a string as value to LAYERS
        LAYERS: subLayersToShow.join(),
        CQL_FILTER: null,
        // Extract .style property from each sub layer.
        // Join them into a string that will be used to
        // reset STYLES param for the GET request.
        STYLES: Object.entries(this.props.layer.layersInfo)
          .filter((k) => subLayersToShow.indexOf(k[0]) !== -1)
          .map((l) => l[1].style)
          .join(","),
      });

      const { layer } = this.props;

      let visibleLayers = [...subLayersToShow];
      if (layer.get("layers") && layer.get("layers").length > 0) {
        visibleLayers.push(layer.get("layers")[0]);
      }

      this.setState({
        visible: true,
        visibleSubLayers: subLayersToShow,
      });
    }
  };

  /**
   * Toggles the visibility of a group layer and handles Snackbar messages for sublayers.
   *
   * This function toggles the visibility of the provided group layer. If the layer becomes visible,
   * it calls setVisible() and checks the current zoom level to see if the layer should be visible.
   * If the layer is not visible at the current zoom level and the conditions to show a Snackbar
   * message are met, it calls the showZoomSnack() function to display a message. The function
   * also updates the state.zoomVisible and state.visibleSubLayers properties accordingly.
   * If the layer becomes hidden, it calls setHidden().
   *
   * Example: If a layer group has 3 sublayers, clicking the checkbox will show
   * or hide all 3 sublayers at once.
   *
   * @param {Object} layer - The group layer to toggle visibility for.
   * @returns {function} - A function to handle the onClick event for the group layer.
   */
  toggleGroupVisible = (layer) => (e) => {
    const visible = !this.state.visible;

    // If the layer is becoming visible.
    if (visible) {
      // Set the layer as visible.
      this.setVisible(layer);

      // Get all sublayers of the layer group.
      const subLayers = Object.keys(layer.getProperties().layerInfo.layersInfo);

      // Get the current zoom level.
      const zoom = this.props.model.olMap.getView().getZoom();
      const lprops = this.props.layer.getProperties();
      const layerIsZoomVisible =
        zoom > lprops.minZoom && zoom <= lprops.maxZoom;

      let showSnack = false;

      // If the layer is not visible at the current zoom level, show a Snackbar.
      // Example: If minMaxZoomAlertOnToggleOnly is set to true, a Snackbar will only be shown
      // when the layer is toggled on and is not visible at the current zoom level.
      if (this.minMaxZoomAlertOnToggleOnly === true) {
        if (!this.state.visible && !layerIsZoomVisible && e?.type === "click") {
          showSnack = true;
        }
      } else {
        // If the layer is not visible at the current zoom level and either
        // state.zoomVisible is true or state.visible is false, a Snackbar will be shown.
        if (
          !layerIsZoomVisible &&
          (this.state.zoomVisible || !this.state.visible)
        ) {
          showSnack = true;
        }
      }

      // If a Snackbar should be shown, call the showZoomSnack function with the subLayers array and set isGroupLayer to true.
      // Example: If a group layer has 3 sublayers and none are visible at the current zoom level,
      // the Snackbar will display a message for each sublayer.
      if (showSnack === true) {
        this.showZoomSnack(subLayers, true);
      }

      // Update the state with the new values for zoomVisible and visibleSubLayers.
      this.setState({
        zoomVisible: layerIsZoomVisible,
        visibleSubLayers: subLayers,
      });
    } else {
      // If the layer is becoming hidden, call setHidden() to set the layer as hidden.
      this.setHidden(layer);
    }
  };

  toggleLayerVisible = (subLayer) => (e) => {
    var visibleSubLayers = [...this.state.visibleSubLayers],
      isVisible = visibleSubLayers.some(
        (visibleSubLayer) => visibleSubLayer === subLayer
      ),
      layerVisibility;

    const { visible } = this.state;
    layerVisibility = visible;

    let isNewSubLayer = false;

    if (isVisible) {
      visibleSubLayers = visibleSubLayers.filter(
        (visibleSubLayer) => visibleSubLayer !== subLayer
      );
    } else {
      visibleSubLayers.push(subLayer);
      // Restore order to its former glory. Sort using original sublayer array.
      visibleSubLayers.sort((a, b) => {
        return (
          this.state.subLayers.indexOf(a) - this.state.subLayers.indexOf(b)
        );
      });
      isNewSubLayer = true;
    }

    if (!visible && visibleSubLayers.length > 0) {
      layerVisibility = true;
      this.setVisible(this.props.layer, subLayer);
    }

    if (visibleSubLayers.length === 0) {
      layerVisibility = false;
      this.setHidden(this.props.layer);
    }

    if (visibleSubLayers.length >= 1) {
      // Create an Array to be used as STYLES param, it should only contain selected sublayers' styles
      let visibleSubLayersStyles = [];
      visibleSubLayers.forEach((subLayer) => {
        visibleSubLayersStyles.push(
          this.props.layer.layersInfo[subLayer].style
        );
      });

      this.props.layer.getSource().updateParams({
        // join(), so we always provide a string as value to LAYERS
        LAYERS: visibleSubLayers.join(),
        // Filter STYLES to only contain styles for currently visible layers,
        // and maintain the order from layersInfo (it's crucial that the order
        // of STYLES corresponds exactly to the order of LAYERS!)
        STYLES: Object.entries(this.props.layer.layersInfo)
          .filter((k) => visibleSubLayers.indexOf(k[0]) !== -1)
          .map((l) => l[1].style)
          .join(","),
        CQL_FILTER: null,
      });
      this.props.layer.setVisible(layerVisibility);
      this.setState({
        visible: layerVisibility,
        visibleSubLayers: visibleSubLayers,
      });

      // Display a Snackbar message if the layer is not visible at the current zoom level.
      const zoom = this.props.model.olMap.getView().getZoom();
      const lprops = this.props.layer.getProperties();
      const layerIsZoomVisible =
        zoom > lprops.minZoom && zoom <= lprops.maxZoom;

      let showSnack = false;

      if (this.minMaxZoomAlertOnToggleOnly === true) {
        if (!this.state.visible && !layerIsZoomVisible && e?.type === "click") {
          showSnack = true;
        }
      } else {
        if (
          !layerIsZoomVisible &&
          (this.state.zoomVisible || !this.state.visible)
        ) {
          showSnack = true;
        }
      }

      if (isNewSubLayer && !layerIsZoomVisible) {
        showSnack = true;
      }

      if (showSnack === true) {
        this.showZoomSnack(subLayer, false);
      }

      this.setState({
        zoomVisible: layerIsZoomVisible,
      });
    } else {
      this.setHidden(this.props.layer);
    }
  };

  renderLegendIcon(url) {
    return <LegendIcon alt="Teckenförklaringsikon" src={url} />;
  }

  renderSubLayer(layer, subLayer, index) {
    const { visibleSubLayers } = this.state;
    const visible = visibleSubLayers.some(
      (visibleSubLayer) => visibleSubLayer === subLayer
    );
    const toggleSettings = this.toggleSubLayerSettings.bind(this, index);
    const legendIcon = layer.layersInfo[subLayer].legendIcon;

    return (
      <LayerInfo key={index}>
        <LayerSummaryContainer>
          <Grid
            container
            alignItems="center"
            wrap="nowrap"
            onClick={this.toggleLayerVisible(subLayer)}
          >
            <CheckBoxWrapper>
              {!visible ? (
                <CheckBoxOutlineBlankIcon />
              ) : (
                <CheckBoxIcon
                  sx={{
                    fill: (theme) =>
                      !this.state.zoomVisible && this.state.visible
                        ? theme.palette.warning.dark
                        : "",
                  }}
                />
              )}
            </CheckBoxWrapper>
            {legendIcon && this.renderLegendIcon(legendIcon)}
            <Caption>{layer.layersInfo[subLayer].caption}</Caption>
          </Grid>
          <SummaryButtonsContainer>
            <SummaryButtonWrapper>
              <DownloadLink
                index={index}
                layer={this.props.layer}
                enableDownloadLink={this.props.mapConfig.map.enableDownloadLink}
              />
            </SummaryButtonWrapper>
            <SummaryButtonWrapper>
              {this.state.toggleSubLayerSettings[index] ? (
                <CloseIcon onClick={() => toggleSettings()} />
              ) : (
                <MoreHorizIcon onClick={() => toggleSettings()} />
              )}
            </SummaryButtonWrapper>
          </SummaryButtonsContainer>
        </LayerSummaryContainer>
        {this.state.toggleSubLayerSettings[index] ? (
          <Grid item xs={12}>
            <LegendImage
              alt="Teckenförklaring"
              src={this.props.layer.layersInfo[subLayer].legend}
            />
          </Grid>
        ) : null}
      </LayerInfo>
    );
  }

  renderSubLayers() {
    const { open } = this.state;
    const { layer } = this.props;

    if (open) {
      return (
        <Box sx={{ marginLeft: "45px" }}>
          {layer.subLayers.map((subLayer, index) =>
            this.renderSubLayer(layer, subLayer, index)
          )}
        </Box>
      );
    } else {
      return null;
    }
  }

  renderInfo() {
    const { infoTitle, infoText } = this.state;
    if (infoText) {
      return (
        <InfoTextContainer>
          <Typography variant="subtitle2">{infoTitle}</Typography>
          <Typography
            variant="body2"
            dangerouslySetInnerHTML={{
              __html: infoText,
            }}
          />
        </InfoTextContainer>
      );
    } else {
      return null;
    }
  }

  renderMetadataLink() {
    const { infoUrl, infoUrlText } = this.state;
    if (infoUrl) {
      return (
        <InfoTextContainer>
          <a href={infoUrl} target="_blank" rel="noopener noreferrer">
            {infoUrlText || infoUrl}
          </a>
        </InfoTextContainer>
      );
    } else {
      return null;
    }
  }

  renderOwner() {
    const { infoOwner } = this.state;
    if (infoOwner) {
      return (
        <InfoTextContainer>
          <Typography
            variant="body2"
            dangerouslySetInnerHTML={{ __html: infoOwner }}
          ></Typography>
        </InfoTextContainer>
      );
    } else {
      return null;
    }
  }

  renderDetails() {
    if (this.state.infoVisible) {
      return (
        <div>
          {this.renderInfo()}
          {this.renderMetadataLink()}
          {this.renderOwner()}
          <div>{this.renderChapterLinks(this.props.chapters || [])}</div>
        </div>
      );
    } else {
      return null;
    }
  }

  toggleSettings() {
    this.setState({
      toggleSettings: !this.state.toggleSettings,
    });
  }

  toggleSubLayerSettings(index) {
    var selected = this.state.toggleSubLayerSettings;
    selected[index] = !selected[index];
    this.setState({ toggleSubLayerSettings: selected });
  }

  renderInfoToggler = () => {
    return (
      !this.isInfoEmpty() && (
        <SummaryButtonWrapper>
          {this.state.infoVisible ? (
            <RemoveCircleIcon onClick={() => this.toggleInfo()} />
          ) : (
            <InfoIcon
              onClick={() => this.toggleInfo()}
              style={{
                boxShadow: this.state.infoVisible
                  ? "rgb(204, 204, 204) 2px 3px 1px"
                  : "inherit",
                borderRadius: "100%",
              }}
            />
          )}
        </SummaryButtonWrapper>
      )
    );
  };

  /**
   * Displays a Snackbar message to inform the user about the layer's visibility at the current zoom level.
   *
   * This function shows a Snackbar message for each visible sublayer that is not visible at the
   * current zoom level, informing the user that the layer is not visible. If the layer is a
   * group layer, it handles the Snackbar messages for all sublayers within the group.
   *
   * @param {Array|string} sublayer - The sublayer or an array of sublayers to show the Snackbar message for.
   * @param {boolean} isGroupLayer - True if the layer is a group layer, false otherwise.
   */
  showZoomSnack(sublayer, isGroupLayer) {
    // If a zoom warning snackbar is already displayed, return without doing anything.
    // This method ensures that only one Snackbar notification is displayed at a time, preventing multiple notifications from overlapping.
    if (this.zoomWarningSnack) return;

    const { layer } = this.props;
    const layerProperties = layer.getProperties();
    const layerInfo = layerProperties.layerInfo || {};
    const layersInfo = layerInfo.layersInfo || {};

    let visibleLayers = [...this.state.visibleSubLayers];
    if (layer.get("layers") && layer.get("layers").length > 0) {
      visibleLayers.push(layer.get("layers")[0]);
    }

    /**
     * Adds captions to sublayers for display in a Snackbar message.
     *
     * This function receives a sublayer and retrieves the corresponding layer caption from the
     * layerInfo object. It then creates a message string and enqueues a Snackbar with the message.
     * The Snackbar will be displayed with a "warning" variant and will be removed when closed.
     *
     * @param {Object} subLayer - The sublayer for which to add captions.
     */
    const addSubLayerCaptions = (subLayer) => {
      if (subLayer) {
        const layerCaption = layersInfo[subLayer]?.caption;
        if (layerCaption) {
          const message = `Lagret "${layerCaption}" är inte synligt vid aktuell zoomnivå.`;

          this.zoomWarningSnack = this.props.enqueueSnackbar(message, {
            variant: "warning",
            preventDuplicate: false,
            onClose: () => {
              this.zoomWarningSnack = null;
            },
          });
        }
      }
    };

    // Check if isGroupLayer is true and sublayer is an array.
    if (isGroupLayer && Array.isArray(sublayer)) {
      // Iterate through the sublayer array and call addSubLayerCaptions for each subLayer.
      sublayer.forEach((subLayer) => {
        addSubLayerCaptions(subLayer);
      });
    } else if (sublayer) {
      // Check if sublayer is defined (not undefined or null).
      addSubLayerCaptions(sublayer);
    } else {
      // If sublayer is undefined, iterate through the visibleLayers array and call addSubLayerCaptions for each subLayer.
      visibleLayers.forEach((subLayer) => {
        addSubLayerCaptions(subLayer);
      });
    }
  }

  /**
   * Returns a checkbox element for the layer group.
   *
   * This function creates and returns a checkbox element for the layer group. The checkbox
   * will toggle the visibility of the layer group when clicked.
   *
   * @returns {ReactElement} - A checkbox element for the layer group.
   */
  getCheckBox() {
    const { layer } = this.props;
    const { visible, visibleSubLayers } = this.state;
    return (
      <CheckBoxWrapper>
        {!visible ? (
          <CheckBoxOutlineBlankIcon />
        ) : visibleSubLayers.length !== layer.subLayers.length ? (
          <CheckBoxIcon sx={{ fill: "gray" }} />
        ) : (
          <CheckBoxIcon />
        )}
      </CheckBoxWrapper>
    );
  }

  render() {
    const { cqlFilterVisible, layer } = this.props;
    const { open, toggleSettings, infoVisible } = this.state;

    const legendIcon = layer.get("layerInfo").legendIcon;
    return (
      <Grid
        sx={{
          marginLeft: this.hideExpandArrow ? "45px" : "21px",
        }}
      >
        <Grid container alignItems="center" wrap="nowrap">
          {this.hideExpandArrow === false && (
            <ExpandButtonWrapper>
              {open ? (
                <KeyboardArrowDownIcon onClick={() => this.toggle()} />
              ) : (
                <KeyboardArrowRightIcon onClick={() => this.toggle()} />
              )}
            </ExpandButtonWrapper>
          )}
          <LayerInfo>
            <LayerSummaryContainer>
              <Grid
                container
                alignItems="center"
                wrap="nowrap"
                onClick={this.toggleGroupVisible(layer)}
              >
                <Grid item>{this.getCheckBox()}</Grid>
                {legendIcon && this.renderLegendIcon(legendIcon)}
                <Caption>{layer.get("caption")}</Caption>
              </Grid>
              <SummaryButtonsContainer>
                {this.renderStatus()}
                {this.renderInfoToggler()}
                <SummaryButtonWrapper>
                  {toggleSettings ? (
                    <CloseIcon onClick={() => this.toggleSettings()} />
                  ) : (
                    <MoreHorizIcon onClick={() => this.toggleSettings()} />
                  )}
                </SummaryButtonWrapper>
              </SummaryButtonsContainer>
            </LayerSummaryContainer>
          </LayerInfo>
        </Grid>
        {this.renderDetails()}
        {toggleSettings && infoVisible && !this.isInfoEmpty() ? <hr /> : null}
        <div>
          <LayerSettings
            options={this.props.options}
            layer={layer}
            cqlFilterVisible={cqlFilterVisible}
            observer={this.props.model.observer}
            toggled={toggleSettings}
            showOpacity={true}
            showLegend={false}
          />
        </div>
        {this.renderSubLayers()}
      </Grid>
    );
  }
}

export default withSnackbar(LayerGroupItem);
