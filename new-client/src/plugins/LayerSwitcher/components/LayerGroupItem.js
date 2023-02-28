import React, { Component } from "react";
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
  constructor(props) {
    super(props);
    const layerInfo = props.layer.get("layerInfo");
    this.state = {
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

  toggleVisible = (layer) => (e) => {
    const visible = !this.state.visible;
    this.setState({
      visible: visible,
    });
    layer.setVisible(visible);
  };

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

      // Check if the layer has minimum and maximum zoom levels set.
      const layerProperties = this.props.layer.getProperties();
      const minZoom = layerProperties.minZoom;
      const maxZoom = layerProperties.maxZoom;
      const currentZoom = this.props.model.olMap.getView().getZoom();

      // If the current zoom level is outside the range of the layer's visibility, show a warning message.
      if (
        (minZoom && currentZoom < minZoom) ||
        (maxZoom && currentZoom > maxZoom)
      ) {
        this.zoomWarningSnack = this.props.enqueueSnackbar(
          `Lagret "${
            subLayer
              ? layerProperties.layerInfo.layersInfo[subLayer].caption
              : layerProperties.caption
          }" är inte synligt vid aktuell zoomnivå.`,
          {
            variant: "warning",
            preventDuplicate: true,
            onClose: () => {
              this.zoomWarningSnack = null;
            },
          }
        );
      } else {
        // If the layer is visible at the current zoom level, close any open warning message.
        if (this.zoomWarningSnack) {
          this.props.closeSnackbar(this.zoomWarningSnack);
          this.zoomWarningSnack = null;
        }
      }

      this.setState({
        visible: true,
        visibleSubLayers: subLayersToShow,
      });
    }
  };

  toggleGroupVisible = (layer) => (e) => {
    const visible = !this.state.visible;
    if (visible) {
      this.setVisible(layer);
    } else {
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

    if (isVisible) {
      visibleSubLayers = visibleSubLayers.filter(
        (visibleSubLayer) => visibleSubLayer !== subLayer
      );
    } else {
      visibleSubLayers.push(subLayer);
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
              {visible ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
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

  render() {
    const { cqlFilterVisible, layer } = this.props;
    const { open, visible, visibleSubLayers, toggleSettings, infoVisible } =
      this.state;

    function getCheckBox() {
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
                {getCheckBox()}
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
