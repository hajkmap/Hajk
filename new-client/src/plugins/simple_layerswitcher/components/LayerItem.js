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
    marginLeft: theme.spacing.unit
  }
});

class LayerItem extends Component {
  constructor() {
    super();
    this.state = {
      caption: "",
      visible: false,
      expanded: false,
      name: "",
      legend: [],
      status: "ok",
      infoVisible: false,
      infoTitle: "",
      infoText: "",
      infoUrl: "",
      infoUrlText: "",
      infoOwner: "",
      infoExpanded: false,
      instruction: ""
    };
  }
  /**
   * Triggered when the component is successfully mounted into the DOM.
   * @instance
   */
  componentDidMount() {
    var layerInfo = this.props.layer.get("layerInfo");
    this.setState({
      caption: layerInfo.caption,
      visible: this.props.layer.get("visible"),
      expanded: false,
      name: this.props.layer.get("name"),
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
              Översiktsplanen:
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

  render() {
    var caption = this.props.layer.get("caption"),
      visible = this.state.visible,
      open = this.state.open;

    if (!caption) {
      return null;
    }

    const { classes } = this.props;

    return (
      <div className={classes.layerItemContainer}>
        <div className={classes.layerItem}>
          <div className={classes.caption}>
            <span onClick={this.toggleVisible(this.props.layer)}>
              {visible ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
              {this.renderStatus()}
              <label className={classes.captionText}>
                <strong>{caption}</strong>
              </label>
            </span>
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
        {this.renderDetails()}
      </div>
    );
  }
}

export default withStyles(styles)(LayerItem);
