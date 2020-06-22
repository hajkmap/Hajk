import React, { Component } from "react";
import cslx from "clsx";
import { Button, Tooltip, Typography } from "@material-ui/core";
import { withStyles } from "@material-ui/core/styles";
import IconWarning from "@material-ui/icons/Warning";
import CallMadeIcon from "@material-ui/icons/CallMade";
import InfoIcon from "@material-ui/icons/Info";
import RemoveCircleIcon from "@material-ui/icons/RemoveCircle";
import CheckBoxIcon from "@material-ui/icons/CheckBox";
import CheckBoxOutlineBlankIcon from "@material-ui/icons/CheckBoxOutlineBlank";
import MoreHorizIcon from "@material-ui/icons/MoreHoriz";
import CloseIcon from "@material-ui/icons/Close";
import ArrowRightIcon from "@material-ui/icons/ArrowRight";
import ArrowDropDownIcon from "@material-ui/icons/ArrowDropDown";
import LayerSettings from "./LayerSettings.js";
import DownloadLink from "./DownloadLink";

const styles = theme => ({
  button: {
    cursor: "pointer"
  },
  caption: {
    display: "flex",
    justifyContent: "space-between"
  },
  captionText: {
    top: "-6px",
    cursor: "pointer",
    fontSize: theme.typography.pxToRem(15)
  },
  image: {},
  links: {
    padding: 0,
    margin: 0,
    listStyle: "none"
  },
  layerItem: {
    justifyContent: "space-between",
    borderBottom: "1px solid #CCC",
    margin: "5px 0"
  },
  layerItemContainer: {
    background: "white",
    borderTopRightRadius: "10px",
    boxShadow:
      "0px 1px 3px 0px rgba(0, 0, 0, 0.2), 0px 1px 1px 0px rgba(0, 0, 0, 0.14), 0px 2px 1px -1px rgba(0, 0, 0, 0.12)"
  },
  layerItemInfo: {
    display: "flex"
  },
  rightIcon: {
    marginLeft: theme.spacing(1),
    fontSize: "16px"
  },
  layerInfo: {
    display: "flex",
    alignItems: "center",
    padding: "3px",
    border: "1px solid #ccc"
  },
  infoContainer: {},
  infoButton: {
    cursor: "pointer"
  },
  infoTextContainer: {
    margin: "10px 45px"
  },
  layerGroup: {
    background: "white",
    paddingTop: "5px",
    paddingBottom: "5px",
    marginLeft: "21px"
  },
  layerGroupWithoutExpandArrow: {
    marginLeft: "45px"
  },
  layerGroupContainer: {
    marginTop: "0",
    marginBottom: "-5px"
  },
  layerGroupHeader: {
    display: "flex",
    justifyContent: "space-between",
    borderBottom: "1px solid #ccc"
  },
  layerGroupLayers: {
    marginLeft: "45px"
  },
  layerGroupItem: {
    display: "flex"
  },
  legend: {},
  slider: {
    padding: "30px",
    overflow: "hidden"
  },
  settingsButton: {
    cursor: "pointer"
  },
  subtitle2: {
    fontWeight: 500
  },
  layerButtons: {
    display: "flex",
    alignItems: "center"
  },
  layerButton: {
    cursor: "pointer",
    fontSize: "15pt",
    width: "32px"
  },
  checkBoxIcon: {
    cursor: "pointer",
    float: "left",
    marginRight: "5px"
  },
  arrowIcon: {
    float: "left"
  }
});

class LayerGroupItem extends Component {
  constructor(props) {
    super(props);
    const layerInfo = props.layer.get("layerInfo");
    this.state = {
      caption: layerInfo.caption,
      visible: props.layer.get("visible"),
      visibleSubLayers: props.layer.get("visible") ? props.layer.subLayers : [],
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
      toggleSubLayerSettings: {}
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
    model.globalObserver.subscribe("layerswitcher.wmsLayerLoadStatus", d => {
      this.state.status !== "loaderror" &&
        this.state.name === d.id &&
        this.setState({
          status: d.status
        });
    });
  }

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
    var src =
      this.state.legend[0] && this.state.legend[0].url
        ? this.state.legend[0].url
        : "";
    return src ? <img width="60" alt="legend" src={src} /> : null;
  }

  openInformative = chapter => e => {
    this.props.onOpenChapter(chapter);
  };

  findChapters(id, chapters) {
    var result = [];
    if (Array.isArray(chapters)) {
      result = chapters.reduce((chaptersWithLayer, chapter) => {
        if (Array.isArray(chapter.layers)) {
          if (chapter.layers.some(layerId => layerId === id)) {
            chaptersWithLayer = [...chaptersWithLayer, chapter];
          }
          if (chapter.chapters.length > 0) {
            chaptersWithLayer = [
              ...chaptersWithLayer,
              ...this.findChapters(id, chapter.chapters)
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
      let chaptersWithLayer = this.findChapters(
        this.props.layer.get("name"),
        chapters
      );
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

  toggleVisible = layer => e => {
    var visible = !this.state.visible;
    this.setState({
      visible: visible
    });
    layer.setVisible(visible);
  };

  toggle() {
    this.setState({
      open: !this.state.open
    });
  }

  toggleInfo() {
    this.setState({
      infoVisible: !this.state.infoVisible
    });
  }

  isInfoEmpty() {
    let chaptersWithLayer = this.findChapters(
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

  setHidden = l => {
    const { layer } = this.props;
    if (l === layer) {
      this.props.layer.getSource().updateParams({
        LAYERS: [this.props.layer.subLayers[0]],
        CQL_FILTER: "EXCLUDE"
      });
      setTimeout(() => {
        this.setState(
          {
            visible: false,
            visibleSubLayers: []
          },
          () => {
            layer.setVisible(false);
          }
        );
      }, 200);
    }
  };

  setVisible = l => {
    const { layer } = this.props;
    if (l === layer) {
      layer.setVisible(true);

      this.props.layer.getSource().updateParams({
        LAYERS: this.props.layer.subLayers,
        CQL_FILTER: null,
        // Extract .style property from each sub layer.
        // Join them into a string that will be used to
        // reset STYLES param for the GET request.
        STYLES: Object.entries(this.props.layer.layersInfo)
          .map(o => o[1])
          .map(l => l.style)
          .join()
      });
      this.setState({
        visible: true,
        visibleSubLayers: this.props.layer.subLayers
      });
    }
  };

  toggleGroupVisible = layer => e => {
    var visible = !this.state.visible;
    if (visible) {
      this.setVisible(layer);
    } else {
      this.setHidden(layer);
    }
  };

  toggleLayerVisible = subLayer => e => {
    var visibleSubLayers = [...this.state.visibleSubLayers],
      isVisible = visibleSubLayers.some(
        visibleSubLayer => visibleSubLayer === subLayer
      ),
      layerVisibility;

    const { visible } = this.state;
    layerVisibility = visible;

    if (isVisible) {
      visibleSubLayers = visibleSubLayers.filter(
        visibleSubLayer => visibleSubLayer !== subLayer
      );
    } else {
      visibleSubLayers.push(subLayer);
    }

    if (!visible && visibleSubLayers.length > 0) {
      layerVisibility = true;
    }

    if (visibleSubLayers.length === 0) {
      layerVisibility = false;
    }

    if (visibleSubLayers.length >= 1) {
      // Create an Array to be used as STYLES param, it should only contain selected sublayers' styles
      let visibleSubLayersStyles = [];
      visibleSubLayers.forEach(subLayer => {
        visibleSubLayersStyles.push(
          this.props.layer.layersInfo[subLayer].style
        );
      });

      this.props.layer.getSource().updateParams({
        LAYERS: visibleSubLayers,
        STYLES: visibleSubLayersStyles.join(),
        CQL_FILTER: null
      });
      this.props.layer.setVisible(layerVisibility);
      this.setState({
        visible: layerVisibility,
        visibleSubLayers: visibleSubLayers
      });
    } else {
      this.setHidden(this.props.layer);
    }
  };

  renderSubLayer(layer, subLayer, index) {
    const { visibleSubLayers } = this.state;
    const { classes } = this.props;

    var visible = visibleSubLayers.some(
      visibleSubLayer => visibleSubLayer === subLayer
    );
    var toggleSettings = this.toggleSubLayerSettings.bind(this, index);

    return (
      <div key={index} className={classes.layerItem}>
        <div className={classes.caption}>
          <div onClick={this.toggleLayerVisible(subLayer)}>
            {visible ? (
              <CheckBoxIcon className={classes.checkBoxIcon} />
            ) : (
              <CheckBoxOutlineBlankIcon className={classes.checkBoxIcon} />
            )}
            <label className={classes.captionText}>
              {layer.layersInfo[subLayer].caption}
            </label>
          </div>
          <div className={classes.layerButtons}>
            <div className={classes.layerButton}>
              <DownloadLink
                index={index}
                layer={this.props.layer}
                appConfig={this.props.appConfig}
              />
            </div>
            <div className={classes.layerButton}>
              {this.state.toggleSubLayerSettings[index] ? (
                <CloseIcon
                  className={classes.settingsButton}
                  onClick={toggleSettings}
                />
              ) : (
                <MoreHorizIcon
                  className={classes.settingsButton}
                  onClick={toggleSettings}
                />
              )}
            </div>
          </div>
        </div>
        <div className={classes.legend}>
          {this.state.toggleSubLayerSettings[index] ? (
            <div>
              <img
                max-width="250px"
                alt="Teckenförklaring"
                src={this.props.layer.layersInfo[subLayer].legend}
              />
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  renderSubLayers() {
    const { open } = this.state;
    const { layer, classes } = this.props;

    if (open) {
      return (
        <div className={classes.layerGroupLayers}>
          {layer.subLayers.map((subLayer, index) =>
            this.renderSubLayer(layer, subLayer, index)
          )}
        </div>
      );
    } else {
      return null;
    }
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
              __html: infoText
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
          ></Typography>
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
          {this.renderOwner()}
          {this.renderMetadataLink()}
          <div>{this.renderChapterLinks(this.props.chapters || [])}</div>
        </div>
      );
    } else {
      return null;
    }
  }

  toggleSettings() {
    this.setState({
      toggleSettings: !this.state.toggleSettings
    });
  }

  toggleSubLayerSettings(index) {
    var selected = this.state.toggleSubLayerSettings;
    selected[index] = !selected[index];
    this.setState({ toggleSubLayerSettings: selected });
  }

  renderInfoToggler = () => {
    const { classes } = this.props;

    return (
      !this.isInfoEmpty() && (
        <div className={classes.layerButton}>
          <div className={classes.infoContainer}>
            {this.state.infoVisible ? (
              <RemoveCircleIcon
                className={classes.infoButton}
                onClick={() => this.toggleInfo()}
              />
            ) : (
              <InfoIcon
                onClick={() => this.toggleInfo()}
                className={classes.infoButton}
                style={{
                  boxShadow: this.state.infoVisible
                    ? "rgb(204, 204, 204) 2px 3px 1px"
                    : "inherit",
                  borderRadius: "100%"
                }}
              />
            )}
          </div>
        </div>
      )
    );
  };

  render() {
    const { classes, cqlFilterVisible, layer } = this.props;
    const { open, visible, visibleSubLayers } = this.state;

    function getIcon() {
      if (visible) {
        if (visibleSubLayers.length === layer.subLayers.length) {
          return <CheckBoxIcon className={classes.checkBoxIcon} />;
        } else {
          return (
            <CheckBoxIcon
              style={{ fill: "gray" }}
              className={classes.checkBoxIcon}
            />
          );
        }
      } else {
        return <CheckBoxOutlineBlankIcon className={classes.checkBoxIcon} />;
      }
    }
    return (
      <div
        className={cslx(classes.layerGroup, {
          [classes.layerGroupWithoutExpandArrow]: this.hideExpandArrow === true
        })}
      >
        <div className={classes.layerGroupContainer}>
          {this.hideExpandArrow === false && (
            <div className={classes.arrowIcon}>
              {open ? (
                <ArrowDropDownIcon
                  className={classes.button}
                  onClick={() => this.toggle()}
                />
              ) : (
                <ArrowRightIcon
                  className={classes.button}
                  onClick={() => this.toggle()}
                />
              )}
            </div>
          )}
          <div className={classes.layerGroupHeader}>
            <div className={classes.layerItemInfo}>
              <div
                className={classes.caption}
                onClick={this.toggleVisible(this.props.layer)}
              >
                <div
                  onClick={this.toggleGroupVisible(layer)}
                  className={classes.caption}
                >
                  <Typography>
                    {getIcon()}
                    <label className={classes.captionText}>
                      {layer.get("caption")}
                    </label>
                  </Typography>
                </div>
              </div>
            </div>
            <div className={classes.layerButtons}>
              {this.renderStatus()}
              {this.renderInfoToggler()}
              <div className={classes.layerButton}>
                {this.state.toggleSettings ? (
                  <CloseIcon onClick={() => this.toggleSettings()} />
                ) : (
                  <MoreHorizIcon
                    onClick={() => this.toggleSettings()}
                    className={classes.settingsButton}
                  />
                )}
              </div>
            </div>
          </div>
          {this.renderDetails()}
          {this.state.toggleSettings &&
          this.state.infoVisible &&
          !this.isInfoEmpty() ? (
            <hr />
          ) : null}
          <div>
            <LayerSettings
              layer={layer}
              cqlFilterVisible={cqlFilterVisible}
              observer={this.props.model.observer}
              toggled={this.state.toggleSettings}
              showOpacity={true}
              showLegend={false}
            />
          </div>
          {this.renderSubLayers()}
        </div>
      </div>
    );
  }
}

export default withStyles(styles)(LayerGroupItem);
