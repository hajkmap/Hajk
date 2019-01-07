import React, { Component } from "react";
import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";
import IconWarning from "@material-ui/icons/Warning";
import CallMadeIcon from "@material-ui/icons/CallMade";
import AddCircleIcon from "@material-ui/icons/AddCircle";
import RemoveCircleIcon from "@material-ui/icons/RemoveCircle";
import CheckBoxIcon from "@material-ui/icons/CheckBox";
import CheckBoxOutlineBlankIcon from "@material-ui/icons/CheckBoxOutlineBlank";
import { withStyles } from "@material-ui/core/styles";

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
  rightIcon: {
    marginLeft: theme.spacing.unit,
    fontSize: "16px"
  },
  layerGroup: {
    padding: "10px",
    margin: "5px",
    background: "white",
    borderTopRightRadius: "10px",
    boxShadow:
      "0px 1px 3px 0px rgba(0, 0, 0, 0.2), 0px 1px 1px 0px rgba(0, 0, 0, 0.14), 0px 2px 1px -1px rgba(0, 0, 0, 0.12)"
  },
  layerGroupContainer: {
    background: "white",
    borderRadius: "6px"
  },
  layerGroupHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    margin: "5px 0"
  },
  layerGroupLayers: {
    background: "#eee",
    padding: "10px",
    borderRadius: "6px"
  },
  layerGroupItem: {
    display: "flex"
  },
  legend: {}
});

class LayerGroupItem extends Component {
  constructor(props) {
    super(props);
    var layerInfo = props.layer.get("layerInfo");
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
      open: false
    };
  }
  /**
   * Triggered when the component is successfully mounted into the DOM.
   * @instance
   */
  componentDidMount() {
    const { model } = this.props;
    model.observer.on("hideLayer", layer => {
      this.setHidden(layer);
    });
  }

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
    return src ? <img width="60" alt="legend" src={src} /> : null;
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
          <>
            <div>
              Innehåll från denna kategori finns benämnt i följande kapitel i
              översiktsplanen:
            </div>
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
          </>
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

  renderDetails() {
    if (this.state.open) {
      return (
        <div>
          <div dangerouslySetInnerHTML={{ __html: this.state.infoText }} />
          <div>{this.renderLegendImage()}</div>
          <div>{this.renderChapterLinks(this.props.chapters)}</div>
        </div>
      );
    }
  }

  setHidden(layer) {
    this.props.layer.getSource().updateParams({
      LAYERS: this.props.layer.subLayers[0],
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

  toggleGroupVisible = layer => e => {
    var visible = !this.state.visible;

    if (visible) {
      layer.setVisible(visible);
      this.props.layer.getSource().updateParams({
        LAYERS: this.props.layer.subLayers,
        CQL_FILTER: null
      });
      this.setState({
        visible: visible,
        visibleSubLayers: visible ? this.props.layer.subLayers : []
      });
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
      this.props.layer.getSource().updateParams({
        LAYERS: visibleSubLayers,
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

    return (
      <div key={index} className={classes.layerItem}>
        <div className={classes.caption}>
          <span onClick={this.toggleLayerVisible(subLayer)}>
            {visible ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
            <label className={classes.captionText}>
              <strong>{layer.layersInfo[subLayer].caption}</strong>
            </label>
          </span>
        </div>
        <div className={classes.legend}>
          <img
            src={this.props.layer.layersInfo[subLayer].legend}
            alt="teckenförklaring"
          />
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

  render() {
    const { layer } = this.props;
    const { open, visible, visibleSubLayers } = this.state;
    const { classes } = this.props;

    function getIcon() {
      if (visible) {
        if (visibleSubLayers.length === layer.subLayers.length) {
          return <CheckBoxIcon />;
        } else {
          return <CheckBoxIcon style={{ fill: "gray" }} />;
        }
      } else {
        return <CheckBoxOutlineBlankIcon />;
      }
    }

    return (
      <div className={classes.layerGroup}>
        <div className={classes.layerGroupContainer}>
          <div className={classes.layerGroupHeader}>
            <div
              onClick={this.toggleGroupVisible(layer)}
              className={classes.caption}
            >
              {getIcon()}
              <label className={classes.captionText}>
                <strong>{layer.get("caption")}</strong>
              </label>
            </div>
            <div>
              {open ? (
                <IconButton
                  className={classes.button}
                  onClick={() => this.toggle()}
                >
                  <RemoveCircleIcon />
                </IconButton>
              ) : (
                <IconButton
                  className={classes.button}
                  onClick={() => this.toggle()}
                >
                  <AddCircleIcon />
                </IconButton>
              )}
            </div>
          </div>
          {this.renderSubLayers()}
        </div>
      </div>
    );
  }
}

export default withStyles(styles)(LayerGroupItem);
