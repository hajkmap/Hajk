import React from "react";
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
import LayerGroupItem from "./LayerGroupItem.js";
import LayerSettings from "./LayerSettings.js";
import DownloadLink from "./DownloadLink.js";

const styles = theme => ({
  button: {
    opacity: "0"
  },
  caption: {
    cursor: "pointer"
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
    display: "flex",
    justifyContent: "space-between",
    marginTop: "0",
    marginBottom: "-5px"
  },
  layerItemContainer: {
    background: "white",
    paddingLeft: "0",
    paddingTop: "5px",
    paddingBottom: "5px",
    borderBottom: "1px solid #CCC",
    marginLeft: "45px"
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
  infoButton: {},
  infoTextContainer: {
    margin: "10px 45px"
  },
  settingsButton: {},
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
  }
});

class LayerItem extends React.PureComponent {
  constructor(props) {
    super(props);
    const { layer } = props;
    var layerInfo = layer.get("layerInfo");
    this.state = {
      caption: layerInfo.caption,
      visible: layer.get("visible"),
      expanded: false,
      name: layer.get("name"),
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
      toggleSettings: false
    };
  }
  /**
   * Triggered when the component is successfully mounted into the DOM.
   * @instance
   */
  componentDidMount() {
    this.props.layer.on("change:visible", e => {
      this.setState({
        visible: !e.oldValue
      });
    });

    // Set load status by subscribing to a global event. Expect ID (int) of layer
    // and status (string "ok"|"loaderror"). Also, once status was set to "loaderror",
    // don't change it back to "ok": we'll get a response for each tile, so most of
    // the tiles might be "ok", but if only one of the tiles has "loaderror", we
    // consider that the layer has failed loading and want to inform the user.
    this.props.app.globalObserver.subscribe(
      "layerswitcher.wmsLayerLoadStatus",
      d => {
        this.state.status !== "loaderror" &&
          this.state.name === d.id &&
          this.setState({
            status: d.status
          });
      }
    );
  }

  /**
   * Toggle visibility of this layer item.
   * Also, if layer is being hidden, reset "status" (if layer loading failed,
   * "status" is "loaderror", and it should be reset if user unchecks layer).
   * @instance
   */
  toggleVisible = layer => e => {
    const visible = !this.state.visible;
    this.setState({
      visible
    });
    layer.setVisible(visible);
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
    var src =
      this.state.legend[0] && this.state.legend[0].url
        ? this.state.legend[0].url
        : "";
    return src ? <img width="30" alt="legend" src={src} /> : null;
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

  toggle() {
    this.setState({
      open: !this.state.open
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
          {this.renderOwner()}
          {this.renderMetadataLink()}
          <div>{this.renderChapterLinks(this.props.chapters || [])}</div>
        </div>
      );
    }
  }

  toggleSettings() {
    this.setState({
      toggleSettings: !this.state.toggleSettings
    });
  }

  toggleInfo() {
    this.setState({
      infoVisible: !this.state.infoVisible
    });
  }

  render() {
    const { classes, layer, model, app, chapters } = this.props;
    const { visible } = this.state;
    const caption = layer.get("caption");
    const cqlFilterVisible =
      this.props.app.config.mapConfig.map?.cqlFilterVisible || false;

    if (!caption) {
      return null;
    }

    if (layer.layerType === "group") {
      return (
        <LayerGroupItem
          appConfig={app.config.appConfig}
          layer={layer}
          model={model}
          chapters={chapters}
          cqlFilterVisible={cqlFilterVisible}
          onOpenChapter={chapter => {
            const informativeWindow = app.windows.find(
              window => window.type === "informative"
            );
            informativeWindow.props.custom.open(chapter);
          }}
        />
      );
    }

    return (
      <div className={classes.layerItemContainer}>
        <div className={classes.layerItem}>
          <div className={classes.layerItemInfo}>
            <div
              className={classes.caption}
              onClick={this.toggleVisible(layer)}
            >
              <Typography>
                {visible ? (
                  <CheckBoxIcon className={classes.checkBoxIcon} />
                ) : (
                  <CheckBoxOutlineBlankIcon className={classes.checkBoxIcon} />
                )}
                <label className={classes.captionText}>{caption}</label>
              </Typography>
            </div>
          </div>
          <div className={classes.layerButtons}>
            <DownloadLink
              layer={this.props.layer}
              appConfig={this.props.app.config.appConfig}
            />
            {this.renderStatus()}
            {!this.isInfoEmpty() && (
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
            )}
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
        <div>
          {this.renderDetails()}
          {this.state.toggleSettings &&
          this.state.infoVisible &&
          !this.isInfoEmpty() ? (
            <hr />
          ) : null}
          <LayerSettings
            layer={layer}
            toggled={this.state.toggleSettings}
            showOpacity={true}
            showLegend={true}
            cqlFilterVisible={cqlFilterVisible}
          />
        </div>
      </div>
    );
  }
}

export default withStyles(styles)(LayerItem);
