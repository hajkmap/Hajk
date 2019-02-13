import React from "react";
import Button from "@material-ui/core/Button";
import IconWarning from "@material-ui/icons/Warning";
import CallMadeIcon from "@material-ui/icons/CallMade";
import InfoIcon from "@material-ui/icons/Info";
import CheckBoxIcon from "@material-ui/icons/CheckBox";
import CheckBoxOutlineBlankIcon from "@material-ui/icons/CheckBoxOutlineBlank";
import { withStyles } from "@material-ui/core/styles";
import "./LayerGroupItem.js";
import LayerGroupItem from "./LayerGroupItem.js";
import Typography from "@material-ui/core/Typography";
import Slider from "@material-ui/lab/Slider";

const styles = theme => ({
  button: {},
  caption: {},
  captionText: {
    marginLeft: "5px",
    position: "relative",
    top: "-6px"
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
    alignItems: "center"
  },
  layerItemContainer: {
    padding: "10px",
    margin: "5px",
    background: "white",
    borderTopRightRadius: "10px",
    boxShadow:
      "0px 1px 3px 0px rgba(0, 0, 0, 0.2), 0px 1px 1px 0px rgba(0, 0, 0, 0.14), 0px 2px 1px -1px rgba(0, 0, 0, 0.12)"
  },
  layerItemInfo: {
    display: "flex",
    alignItems: "center"
  },
  rightIcon: {
    marginLeft: theme.spacing.unit,
    fontSize: "16px"
  },
  layerInfo: {
    display: "flex",
    alignItems: "center",
    padding: "3px",
    border: "1px solid #ccc"
  },
  infoContainer: {
    padding: "5px",
    marginRight: "5px",
    borderRight: "1px solid #ccc"
  },
  infoButton: {
    fontSize: "14pt",
    cursor: "pointer"
  },
  infoTextContainer: {
    margin: "10px 0"
  },
  slider: {
    padding: "30px",
    overflow: "hidden"
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
      opacity: layer.get("opacity"),
      opacityValue: 1
    };
  }
  /**
   * Triggered when the component is successfully mounted into the DOM.
   * @instance
   */
  componentDidMount() {
    this.props.layer.on("change:opacity", e => {
      var o = e.target.getOpacity();
      if (o === 0 || o === 1) {
        this.setState({
          opacityValue: o
        });
      }
    });
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
      <IconWarning
        style={{ float: "right" }}
        title="Lagret kunde inte laddas in. Kartservern svarar inte."
      />
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
    return chapters.reduce((chaptersWithLayer, chapter) => {
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
          <Typography variant="h6">{infoTitle}</Typography>
          <Typography>{infoText}</Typography>
        </div>
      );
    } else {
      return null;
    }
  }

  renderMetadataLink() {
    const { infoUrl, infoUrlText } = this.state;
    if (infoUrl) {
      return (
        <div>
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
    if (infoOwner) {
      return (
        <Typography>
          <strong>Datavärd:</strong> {infoOwner}
        </Typography>
      );
    } else {
      return null;
    }
  }

  renderDetails() {
    if (this.state.open) {
      return (
        <div>
          {this.renderInfo()}
          {this.renderOwner()}
          {this.renderMetadataLink()}
          <div>{this.renderChapterLinks(this.props.chapters)}</div>
        </div>
      );
    }
  }

  renderOpacitySlider() {
    let opacityValue = this.state.opacityValue;
    const { classes } = this.props;
    return (
      <>
        <Slider
          classes={{ container: classes.slider }}
          value={opacityValue}
          min={0}
          max={1}
          step={0.1}
          onChange={this.opacitySliderChanged}
        />
      </>
    );
  }

  /* This function does two things:
   * 1) it updates opacityValue, which is in state,
   *    and is important as <Slider> uses it to set
   *    its internal value.
   * 2) it changes OL layer's opacity
   *
   * As <Slider> is set up to return a value between
   * 0 and 1 and it has a step of 0.1, we don't have
   * to worry about any conversion and rounding here.
   * */
  opacitySliderChanged = (event, opacityValue) => {
    this.setState({ opacityValue }, () => {
      this.props.layer.setOpacity(this.state.opacityValue);
    });
  };

  render() {
    var caption = this.props.layer.get("caption"),
      visible = this.state.visible;

    if (!caption) {
      return null;
    }
    const { classes } = this.props;
    if (this.props.layer.layerType === "group") {
      return (
        <LayerGroupItem
          layer={this.props.layer}
          model={this.props.model}
          chapters={this.props.chapters}
          onOpenChapter={chapter => {
            var informativePanel = this.props.app.panels.find(
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
            <div className={classes.infoContainer}>
              {!this.isInfoEmpty() ? (
                <InfoIcon
                  onClick={() => this.toggle()}
                  className={classes.infoButton}
                  style={{
                    boxShadow: this.state.open
                      ? "rgb(204, 204, 204) 2px 3px 1px"
                      : "inherit",
                    borderRadius: "100%"
                  }}
                />
              ) : (
                <InfoIcon
                  onClick={() => this.toggle()}
                  className={classes.infoButton}
                  style={{
                    color: "#999",
                    cursor: "default"
                  }}
                />
              )}
            </div>
            <div
              className={classes.caption}
              onClick={this.toggleVisible(this.props.layer)}
            >
              {visible ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
              {this.renderStatus()}
              <label className={classes.captionText}>
                <strong>{caption}</strong>
              </label>
            </div>
          </div>
          <div>
            <div className={classes.layerInfo}>{this.renderLegendImage()}</div>
          </div>
        </div>
        {this.renderDetails()}
        {this.renderOpacitySlider()}
      </div>
    );
  }
}

export default withStyles(styles)(LayerItem);
