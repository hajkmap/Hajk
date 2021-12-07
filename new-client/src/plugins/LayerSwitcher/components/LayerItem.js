import React from "react";
import { withSnackbar } from "notistack";
import { withStyles } from "@material-ui/core/styles";
import { Button, Tooltip, Typography, Grid } from "@material-ui/core";

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
    const layerInfo = layer.get("layerInfo");

    this.isBackgroundLayer = layerInfo.layerType === "base";
    this.caption = layerInfo.caption;
    this.name = layer.get("name");
    this.legend = layerInfo.legend;
    this.legendIcon = layerInfo.legendIcon;
    this.infoTitle = layerInfo.infoTitle;
    this.infoText = layerInfo.infoText;
    this.infoUrl = layerInfo.infoUrl;
    this.infoUrlText = layerInfo.infoUrlText;
    this.infoOwner = layerInfo.infoOwner;
    this.localObserver = layer.localObserver;
    this.usesMinMaxZoom = this.layerUsesMinMaxZoom();
    this.minMaxZoomAlertOnToggleOnly = layer.get("minMaxZoomAlertOnToggleOnly");

    this.state = {
      visible: layer.get("visible"),
      status: "ok",
      zoomVisible: true,
      open: false,
      toggleSettings: false,
      infoVisible: false,
    };

    // Subscribe to events sent when another background layer is clicked and
    // disable all other layers to implement the RadioButton behaviour
    if (this.isBackgroundLayer) {
      layer.localObserver.subscribe("backgroundLayerChanged", (activeLayer) => {
        if (activeLayer !== this.name) {
          if (!layer.isFakeMapLayer) {
            layer.setVisible(false);
          }
          this.setState({
            visible: false,
          });
        }
      });
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

    this.triggerZoomCheck(null, this.state.visible);
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
          this.name === d.id &&
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

    if (showSnack === true) {
      this.showZoomSnack();
    }

    this.setState({
      zoomVisible: layerIsZoomVisible,
    });
    return layerIsZoomVisible;
  };

  listenToZoomChange(bListen) {
    if (!this.usesMinMaxZoom) return;

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
      `Lagret "${this.caption}" visas endast vid specifika skalor.`,
      {
        variant: "warning",
        preventDuplicate: true,
        onClose: () => {
          this.zoomWarningSnack = null;
        },
      }
    );
  }

  triggerZoomCheck(e, visible) {
    if (!this.usesMinMaxZoom) return;

    this.zoomEndHandler(e);

    if (visible === false) {
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
    if (this.isBackgroundLayer) {
      document.getElementById("map").style.backgroundColor = "#FFF"; // sets the default background color to white
      if (layer.isFakeMapLayer) {
        switch (this.name) {
          case "-2":
            document.getElementById("map").style.backgroundColor = "#000";
            break;
          case "-1":
          default:
            document.getElementById("map").style.backgroundColor = "#FFF";
            break;
        }
      } else {
        layer.setVisible(true);
      }
      this.setState({ visible: true });
      // Publish event to ensure all other background layers are disabled
      layer.localObserver.publish("backgroundLayerChanged", this.name);
    } else {
      const visible = !this.state.visible;
      this.setState({
        visible,
      });
      this.props.layer.setVisible(visible);
      this.triggerZoomCheck(e, visible);
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
      this.legend && this.legend[0] && this.legend[0].url
        ? this.legend[0].url
        : "";
    return src ? <img width="30" alt="legend" src={src} /> : null;
  }

  isInfoEmpty() {
    let chaptersWithLayer = this.findChapters(this.name, this.props.chapters);
    return !(
      this.infoCaption ||
      this.infoUrl ||
      this.infoOwner ||
      this.infoText ||
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
      let chaptersWithLayer = this.findChapters(this.name, chapters);
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
    const { classes } = this.props;
    if (this.infoText) {
      return (
        <div className={classes.infoTextContainer}>
          <Typography variant="subtitle2">{this.infoTitle}</Typography>
          <Typography
            variant="body2"
            dangerouslySetInnerHTML={{
              __html: this.infoText,
            }}
          />
        </div>
      );
    } else {
      return null;
    }
  }

  renderMetadataLink() {
    const { classes } = this.props;
    if (this.infoUrl) {
      return (
        <div className={classes.infoTextContainer}>
          <a href={this.infoUrl} target="_blank" rel="noopener noreferrer">
            {this.infoUrlText || this.infoUrl}
          </a>
        </div>
      );
    } else {
      return null;
    }
  }

  renderOwner() {
    const { classes } = this.props;
    if (this.infoOwner) {
      return (
        <div className={classes.infoTextContainer}>
          <Typography
            variant="body2"
            dangerouslySetInnerHTML={{ __html: this.infoOwner }}
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
    return (
      <Grid item>
        <div className={classes.legendIconContainer}>
          <img
            alt="Teckenförklaring"
            src={this.legendIcon}
            className={classes.legendIcon}
          />
        </div>
      </Grid>
    );
  }

  render() {
    const { classes, layer, model, app, chapters } = this.props;
    const { visible } = this.state;

    const cqlFilterVisible =
      this.props.app.config.mapConfig.map?.cqlFilterVisible || false;

    if (!this.caption) {
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
          this.isBackgroundLayer
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
                this.isBackgroundLayer ? (
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
              ) : this.isBackgroundLayer ? (
                <RadioButtonUnchecked className={classes.checkBoxIcon} />
              ) : (
                <CheckBoxOutlineBlankIcon className={classes.checkBoxIcon} />
              )}

              {this.legendIcon && this.renderLegendIcon()}
              <Grid item>
                <Typography className={classes.captionText}>
                  {this.caption}
                </Typography>
              </Grid>
            </Grid>
          </div>
          <div className={classes.layerButtons}>
            {layer.isFakeMapLayer ? null : (
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
          {layer.isFakeMapLayer ? null : (
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
