import React from "react";
import { Button, Tooltip, Typography, Grid } from "@material-ui/core";
import { withStyles } from "@material-ui/core/styles";
import IconWarning from "@material-ui/icons/Warning";
import CallMadeIcon from "@material-ui/icons/CallMade";
import InfoIcon from "@material-ui/icons/Info";
import RemoveCircleIcon from "@material-ui/icons/RemoveCircle";
import CheckBoxIcon from "@material-ui/icons/CheckBox";
import RadioButtonChecked from "@material-ui/icons/RadioButtonChecked";
import RadioButtonUnchecked from "@material-ui/icons/RadioButtonUnchecked";
import CheckBoxOutlineBlankIcon from "@material-ui/icons/CheckBoxOutlineBlank";
import MoreHorizIcon from "@material-ui/icons/MoreHoriz";
import CloseIcon from "@material-ui/icons/Close";
import LayerGroupItem from "./LayerGroupItem.js";
import LayerSettings from "./LayerSettings.js";
import DownloadLink from "./DownloadLink.js";
import { withSnackbar } from "notistack";

const styles = (theme) => ({
  button: {
    opacity: "0",
  },
  caption: {
    cursor: "pointer",
  },
  captionText: {
    top: "-6px",
    cursor: "pointer",
    fontSize: theme.typography.pxToRem(15),
  },
  image: {},
  links: {
    padding: 0,
    margin: 0,
    listStyle: "none",
  },
  layerItem: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "0",
    marginBottom: "-5px",
  },
  layerItemContainer: {
    paddingLeft: "0",
    paddingTop: "5px",
    paddingBottom: "5px",
    borderBottom: `${theme.spacing(0.2)}px solid ${theme.palette.divider}`,
    marginLeft: "45px",
  },
  layerItemBackgroundContainer: {
    paddingLeft: "0",
    paddingTop: "6px",
    paddingBottom: "5px",
    borderBottom: `${theme.spacing(0.2)}px solid ${theme.palette.divider}`,
    marginLeft: "0px",
  },
  layerItemInfo: {
    display: "flex",
  },
  rightIcon: {
    marginLeft: theme.spacing(1),
    fontSize: "16px",
  },
  layerInfo: {
    display: "flex",
    alignItems: "center",
    padding: "3px",
    border: `${theme.spacing(0.2)}px solid ${theme.palette.divider}`,
  },
  infoContainer: {},
  infoButton: {},
  infoTextContainer: {
    margin: "10px 45px",
  },
  settingsButton: {},
  layerButtons: {
    display: "flex",
    alignItems: "center",
  },
  layerButton: {
    cursor: "pointer",
    fontSize: "15pt",
    width: "32px",
  },
  legendIconContainer: {
    display: "flex",
  },
  legendIcon: {
    width: theme.typography.pxToRem(18),
    height: theme.typography.pxToRem(18),
    marginRight: "5px",
  },
  checkBoxIcon: {
    cursor: "pointer",
    marginRight: "5px",
  },
  checkBoxIconWarning: {
    fill: theme.palette.warning.dark,
  },
});

class LayerItem extends React.PureComponent {
  constructor(props) {
    super(props);
    const { layer } = props;
    let visible = layer.get("visible");
    let name = layer.get("name");

    const layerInfo = layer.get("layerInfo");
    this.state = {
      caption: layerInfo.caption,
      visible: visible,
      expanded: false,
      name: name,
      legend: layerInfo.legend,
      legendIcon: layerInfo.legendIcon,
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
      toggleSettings: false,
      isBackgroundLayer: layer.isBackgroundLayer ?? false,
      localObserver: layer.localObserver ?? null,
      usesMinMaxZoom: this.layerUsesMinMaxZoom(),
      zoomVisible: true,
    };
    if (layer) {
      if (layer.isDefaultBackground) {
        this.state.backgroundSpecialCaseId = layer.backgroundSpecialCaseId;
      }
      // Subscribe to events sent when another background layer is clicked and
      // disable all other layers to implement the RadioButton behaviour
      if (layer.isBackgroundLayer) {
        layer.localObserver.subscribe(
          "backgroundLayerChanged",
          (activeLayer) => {
            if (activeLayer !== this.state.name) {
              if (layer.isDefaultBackground) {
                if (layer.backgroundSpecialCaseId === "-3") {
                  layer.osmLayer.setVisible(false);
                }
              } else {
                layer.setVisible(false);
              }
              this.setState({
                visible: false,
              });
            }
          }
        );
      }
    }
  }

  /**
   * Triggered when the component is successfully mounted into the DOM.
   * @instance
   */
  componentDidMount() {
    this.props.layer.on?.("change:visible", (e) => {
      const visible = !e.oldValue;
      this.setState({
        visible,
      });

      this.listenToZoomChange(visible);
    });
    this.triggerZoomCheck(this.state.visible);
    this.listenToZoomChange(this.state.visible);

    // Set load status by subscribing to a global event. Expect ID (int) of layer
    // and status (string "ok"|"loaderror"). Also, once status was set to "loaderror",
    // don't change it back to "ok": we'll get a response for each tile, so most of
    // the tiles might be "ok", but if only one of the tiles has "loaderror", we
    // consider that the layer has failed loading and want to inform the user.
    this.props.app.globalObserver.subscribe(
      "layerswitcher.wmsLayerLoadStatus",
      (d) => {
        this.state.status !== "loaderror" &&
          this.state.name === d.id &&
          this.setState({
            status: d.status,
          });
      }
    );
  }

  layerUsesMinMaxZoom() {
    const lprops = this.props.layer.getProperties();
    const maxZ = lprops.maxZoom ?? 0;
    const minZ = lprops.minZoom ?? 0;
    // When reading min/max-Zoom from layer, its not consistent with the
    // initial values from config. Suddenly Infinity is used.
    return (maxZ > 0 && maxZ < Infinity) || (minZ > 0 && minZ < Infinity);
  }

  zoomEndHandler = (e) => {
    const zoom = this.props.model.olMap.getView().getZoom();
    const lprops = this.props.layer.getProperties();
    const layerIsZoomVisible = zoom > lprops.minZoom && zoom <= lprops.maxZoom;

    if (this.state.zoomVisible && !layerIsZoomVisible) {
      this.showZoomSnack();
    }

    this.setState({
      zoomVisible: layerIsZoomVisible,
    });
    return layerIsZoomVisible;
  };

  listenToZoomChange(bListen) {
    if (!this.state.usesMinMaxZoom) return;

    const eventName = "core.zoomEnd";
    if (bListen && !this.zoomEndListener) {
      this.zoomEndListener = this.props.app.globalObserver.subscribe(
        eventName,
        this.zoomEndHandler
      );
    } else {
      if (this.zoomEndListener) {
        this.props.app.globalObserver.unsubscribe(
          eventName,
          this.zoomEndListener
        );
        this.zoomEndListener = null;
      }
    }
  }

  showZoomSnack() {
    if (this.zoomWarningSnack) return;
    this.zoomWarningSnack = this.props.enqueueSnackbar(
      `Lagret "${this.state.caption}" visas endast vid specifika skalor.`,
      {
        variant: "warning",
        preventDuplicate: true,
        onClose: () => {
          this.zoomWarningSnack = null;
        },
      }
    );
  }

  triggerZoomCheck(visible) {
    if (!this.state.usesMinMaxZoom) return;

    if (visible) {
      if (!this.zoomEndHandler()) {
        this.showZoomSnack();
      }
    } else {
      if (!this.zoomWarningSnack) return;
      this.props.closeSnackbar(this.zoomWarningSnack);
      this.zoomWarningSnack = null;
    }
  }

  /**
   * Toggle visibility of this layer item.
   * Also, if layer is being hidden, reset "status" (if layer loading failed,
   * "status" is "loaderror", and it should be reset if user unchecks layer).
   * @instance
   */
  toggleVisible = (e) => {
    const layer = this.props.layer;
    if (layer.isBackgroundLayer) {
      document.getElementById("map").style.backgroundColor = "#FFF"; // sets the default background color to white
      if (layer.isDefaultBackground) {
        if (layer.backgroundSpecialCaseId === "-2") {
          document.getElementById("map").style.backgroundColor = "#000";
        } else if (layer.backgroundSpecialCaseId === "-1") {
          document.getElementById("map").style.backgroundColor = "#FFF";
        } else if (layer.backgroundSpecialCaseId === "-3") {
          layer.osmLayer.setVisible(true);
        }
      } else {
        layer.setVisible(true);
      }
      this.setState({ visible: true });
      // Publish event to ensure all other background layers are disabled
      layer.localObserver.publish("backgroundLayerChanged", this.state.name);
    } else {
      const visible = !this.state.visible;
      this.setState({
        visible,
      });
      this.props.layer.setVisible(visible);
      this.triggerZoomCheck(visible);
    }
  };

  /**
   * Render the load information component.
   * @instance
   * @return {external:ReactElement}
   */
  renderStatus() {
    const { classes } = this.props;
    return (
      this.state.status === "loaderror" && (
        <div className={classes.layerButton}>
          <Tooltip title="Lagret kunde inte laddas in. Kartservern svarar inte.">
            <IconWarning />
          </Tooltip>
        </div>
      )
    );
  }

  renderLegendImage() {
    const src =
      this.state.legend && this.state.legend[0] && this.state.legend[0].url
        ? this.state.legend[0].url
        : "";
    return src ? <img width="30" alt="legend" src={src} /> : null;
  }

  isInfoEmpty() {
    let chaptersWithLayer = this.findChapters(
      this.state.name,
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

  openInformative = (chapter) => (e) => {
    this.props.onOpenChapter(chapter);
  };

  findChapters(id, chapters) {
    let result = [];
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
    const { classes } = this.props;
    if (chapters && chapters.length > 0) {
      let chaptersWithLayer = this.findChapters(this.state.name, chapters);
      if (chaptersWithLayer.length > 0) {
        return (
          <div className={classes.infoTextContainer}>
            <Typography>
              Innehåll från denna kategori finns benämnt i följande kapitel i
              översiktsplanen:
            </Typography>
            <ul className={classes.links}>
              {chaptersWithLayer.map((chapter, i) => {
                return (
                  <li key={i}>
                    <Button
                      size="small"
                      onClick={this.openInformative(chapter)}
                    >
                      {chapter.header}
                      <CallMadeIcon className={classes.rightIcon} />
                    </Button>
                  </li>
                );
              })}
            </ul>
          </div>
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

  renderInfo() {
    const { infoTitle, infoText } = this.state;
    const { classes } = this.props;
    if (infoText) {
      return (
        <div className={classes.infoTextContainer}>
          <Typography variant="subtitle2">{infoTitle}</Typography>
          <Typography
            variant="body2"
            dangerouslySetInnerHTML={{
              __html: infoText,
            }}
          />
        </div>
      );
    } else {
      return null;
    }
  }

  renderMetadataLink() {
    const { infoUrl, infoUrlText } = this.state;
    const { classes } = this.props;
    if (infoUrl) {
      return (
        <div className={classes.infoTextContainer}>
          <a href={infoUrl} target="_blank" rel="noopener noreferrer">
            {infoUrlText || infoUrl}
          </a>
        </div>
      );
    } else {
      return null;
    }
  }

  renderOwner() {
    const { infoOwner } = this.state;
    const { classes } = this.props;
    if (infoOwner) {
      return (
        <div className={classes.infoTextContainer}>
          <Typography
            variant="body2"
            dangerouslySetInnerHTML={{ __html: infoOwner }}
          />
        </div>
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
    }
  }

  toggleSettings = () => {
    this.setState({
      toggleSettings: !this.state.toggleSettings,
    });
  };

  toggleInfo = () => {
    this.setState({
      infoVisible: !this.state.infoVisible,
    });
  };

  renderLegendIcon() {
    const { classes } = this.props;
    const { legendIcon } = this.state;
    return (
      <Grid item>
        <div className={classes.legendIconContainer}>
          <img
            alt="Teckenförklaring"
            src={legendIcon}
            className={classes.legendIcon}
          />
        </div>
      </Grid>
    );
  }

  render() {
    const { classes, layer, model, app, chapters } = this.props;
    const { visible, legendIcon } = this.state;
    const caption = this.state.caption;

    const cqlFilterVisible =
      this.props.app.config.mapConfig.map?.cqlFilterVisible || false;

    if (!caption) {
      return null;
    }

    if (layer.layerType === "group") {
      return (
        <LayerGroupItem
          appConfig={app.config.appConfig}
          mapConfig={app.config.mapConfig}
          layer={layer}
          model={model}
          options={this.props.options}
          chapters={chapters}
          cqlFilterVisible={cqlFilterVisible}
          onOpenChapter={(chapter) => {
            const informativeWindow = app.windows.find(
              (window) => window.type === "informative"
            );
            informativeWindow.props.custom.open(chapter);
          }}
        />
      );
    }

    return (
      <div
        className={
          this.state.isBackgroundLayer
            ? classes.layerItemBackgroundContainer
            : classes.layerItemContainer
        }
      >
        <div className={classes.layerItem}>
          <div>
            <Grid
              wrap="nowrap"
              alignItems="center"
              container
              onClick={this.toggleVisible.bind(this)}
            >
              {visible ? (
                this.state.isBackgroundLayer ? (
                  <RadioButtonChecked className={classes.checkBoxIcon} />
                ) : (
                  <CheckBoxIcon
                    className={`${classes.checkBoxIcon} ${
                      !this.state.zoomVisible && this.state.visible
                        ? classes.checkBoxIconWarning
                        : ""
                    }`}
                  />
                )
              ) : this.state.isBackgroundLayer ? (
                <RadioButtonUnchecked className={classes.checkBoxIcon} />
              ) : (
                <CheckBoxOutlineBlankIcon className={classes.checkBoxIcon} />
              )}

              {legendIcon && this.renderLegendIcon()}
              <Grid item>
                <Typography className={classes.captionText}>
                  {caption}
                </Typography>
              </Grid>
            </Grid>
          </div>
          <div className={classes.layerButtons}>
            {layer.isDefaultBackground ? null : (
              <DownloadLink
                layer={this.props.layer}
                enableDownloadLink={
                  this.props.app.config.mapConfig.map.enableDownloadLink
                }
              />
            )}

            {this.renderStatus()}
            {!this.isInfoEmpty() && (
              <div className={classes.layerButton}>
                <div className={classes.infoContainer}>
                  {this.state.infoVisible ? (
                    <RemoveCircleIcon
                      className={classes.infoButton}
                      onClick={this.toggleInfo}
                    />
                  ) : (
                    <InfoIcon
                      onClick={this.toggleInfo}
                      className={classes.infoButton}
                      style={{
                        boxShadow: this.state.infoVisible
                          ? "rgb(204, 204, 204) 2px 3px 1px"
                          : "inherit",
                        borderRadius: "100%",
                      }}
                    />
                  )}
                </div>
              </div>
            )}
            <div className={classes.layerButton}>
              {this.state.toggleSettings ? (
                <CloseIcon onClick={this.toggleSettings} />
              ) : (
                <MoreHorizIcon
                  onClick={this.toggleSettings}
                  className={classes.settingsButton}
                />
              )}
            </div>
          </div>
        </div>
        <div>
          {this.renderDetails()}
          {this.state.toggleSettings &&
          this.state.infoVisible &&
          !this.isInfoEmpty() ? (
            <hr />
          ) : null}
          {layer.isDefaultBackground &&
          layer.backgroundSpecialCaseId !== "-3" ? null : (
            <LayerSettings
              options={this.props.options}
              layer={layer}
              toggled={this.state.toggleSettings}
              showOpacity={true}
              showLegend={true}
              cqlFilterVisible={cqlFilterVisible}
            />
          )}
        </div>
      </div>
    );
  }
}

export default withStyles(styles)(withSnackbar(LayerItem));
