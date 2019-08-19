import React from "react";
import Button from "@material-ui/core/Button";
import IconWarning from "@material-ui/icons/Warning";
import CallMadeIcon from "@material-ui/icons/CallMade";
import InfoIcon from "@material-ui/icons/Info";
import RemoveCircleIcon from "@material-ui/icons/RemoveCircle";
import CheckBoxIcon from "@material-ui/icons/CheckBox";
import CheckBoxOutlineBlankIcon from "@material-ui/icons/CheckBoxOutlineBlank";
import Typography from "@material-ui/core/Typography";
import { withStyles } from "@material-ui/core/styles";
import MoreHorizIcon from "@material-ui/icons/MoreHoriz";
import CloseIcon from "@material-ui/icons/Close";
import LayerGroupItem from "./LayerGroupItem.js";
import LayerSettings from "./LayerSettings.js";

const styles = theme => ({
  button: {
    opacity: "0"
  },
  caption: {
    cursor: "pointer"
  },
  captionText: {
    marginLeft: "5px",
    position: "relative",
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
    alignItems: "center",
    marginTop: "0",
    marginBottom: "-5px"
  },
  layerItemContainer: {
    background: "white",
    paddingLeft: "0",
    borderBottom: "1px solid #ccc",
    marginLeft: "45px"
  },
  layerItemInfo: {
    display: "flex",
    alignItems: "center"
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
  infoContainer: {
    padding: "5px"
  },
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
  }

  /**
   * Toggle visibility of this layer item.
   * @instance
   */
  toggleVisible = layer => e => {
    var visible = !this.state.visible;
    this.setState({
      visible: visible
    });
    layer.setVisible(visible);
  };

  /**
   * Render the load information component.
   * @instance
   * @return {external:ReactElement}
   */
  renderStatus() {
    return this.state.status === "loaderror" ? (
      <IconWarning title="Lagret kunde inte laddas in. Kartservern svarar inte." />
    ) : null;
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
          <Typography>
            <span dangerouslySetInnerHTML={{ __html: infoOwner }} />
          </Typography>
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

    if (!caption) {
      return null;
    }

    if (layer.layerType === "group") {
      return (
        <LayerGroupItem
          layer={layer}
          model={model}
          chapters={chapters}
          onOpenChapter={chapter => {
            var informativePanel = app.panels.find(
              panel => panel.type === "informative"
            );
            informativePanel.open(chapter);
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
                {visible ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
                <label className={classes.captionText}>{caption}</label>
              </Typography>
            </div>
          </div>
          <div className={classes.layerButtons}>
            <div className={classes.layerButton}>{this.renderStatus()}</div>
            <div className={classes.layerButton}>
              <div className={classes.infoContainer}>
                {!this.isInfoEmpty() ? (
                  this.state.infoVisible ? (
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
                  )
                ) : (
                  <InfoIcon
                    onClick={() => this.toggleInfo()}
                    className={classes.infoButton}
                    style={{
                      color: "gray",
                      cursor: "default",
                      visibility: "hidden"
                    }}
                  />
                )}
              </div>
            </div>
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
          />
        </div>
      </div>
    );
  }
}

export default withStyles(styles)(LayerItem);
