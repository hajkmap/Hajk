import "./LayerItem.css";
import React, { Component } from "react";

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
      instruction: layerInfo.instruction
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
      <i
        className="material-icons pull-right"
        title="Lagret kunde inte laddas in. Kartservern svarar inte."
      >
        warning
      </i>
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
    if (chapters) {
      let chaptersWithLayer = this.findChapters(
        this.props.layer.get("name"),
        chapters
      );
      return (
        <ul>
          {chaptersWithLayer.map((chapter, i) => {
            return (
              <li key={i}>
                <a href="#text1" onClick={this.openInformative(chapter)}>
                  {chapter.header}
                </a>
              </li>
            );
          })}
        </ul>
      );
    } else {
      return null;
    }
  }

  render() {
    var caption = this.props.layer.get("caption"),
      visible = this.state.visible;

    if (!caption) {
      return null;
    }

    return (
      <div className="panel panel-default layer-item">
        <div className="panel-heading unselectable clearfix">
          <div className="left-col">
            <span
              onClick={this.toggleVisible(this.props.layer)}
              className="clickable"
            >
              <i className="material-icons" style={{ width: "2rem" }}>
                {visible ? "check_box" : "check_box_outline_blank"}
              </i>
              {this.renderStatus()}
              <label
                className={
                  visible
                    ? "layer-item-header-text active-group"
                    : "layer-item-header-text"
                }
              >
                <strong>{caption}</strong>
              </label>
            </span>
            <p
              className="info-title"
              dangerouslySetInnerHTML={{ __html: this.state.infoText }}
            />
          </div>
          <div className="right-col">{this.renderLegendImage()}</div>
        </div>
        <div className="clearfix">
          {this.renderChapterLinks(this.props.chapters)}
        </div>
      </div>
    );
  }
}

export default LayerItem;
