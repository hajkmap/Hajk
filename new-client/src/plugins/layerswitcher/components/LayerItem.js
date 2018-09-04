import "./LayerItem.css";
import React, { Component } from "react";
import Typography from "@material-ui/core/Typography";
import Slider from "@material-ui/lab/Slider";

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
      instruction: "",
      opacityValue: 1
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
      opacity: this.props.layer.get("opacity")
    });
  }

  /**
   * Triggered when component unmounts.
   * @instance
   */
  componentWillUnmount() {}

  /**
   * On visible change event handler.
   * @instance
   */
  onVisibleChanged() {}

  /**
   * On legend change event handler.
   * @instance
   */
  onLegendChanged() {}

  /**
   * On show legend change event handler.
   * @instance
   */
  onShowLegendChanged() {}

  /**
   * On show info change event handler.
   * @instance
   */
  onShowInfoChanged() {}

  /**
   * Toggle visibility of this layer item.
   * @instance
   */
  toggleVisible(e) {
    var visible = !this.state.visible;
    this.setState({
      visible: visible
    });
    this.props.layer.setVisible(visible);
  }

  /**
   * Toggle legend visibility
   * @instance
   */
  toggleLegend() {}

  /**
   * Toggle info visibility
   * @instance
   */
  toggleInfo() {}

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
  handleChange = (event, opacityValue) => {
    this.setState({ opacityValue }, () => {
      this.props.layer.setOpacity(this.state.opacityValue);
    });
  };

  render() {
    let opacityValue = this.state.opacityValue;

    var caption = this.props.layer.get("caption"),
      expanded = this.state.showLegend,
      visible = this.state.visible,
      toggleLegend = e => {
        this.toggleLegend(e);
      },
      toggleVisible = e => {
        this.toggleVisible(e);
      },
      toggleInfo = e => {
        this.toggleInfo(e);
      },
      infoVisible = this.state.infoVisible;

    var components = {
      legend: {
        legendButton: null
      }
    };
    var innerInfoBodyClass = "hidden";
    var innerBodyClass = "hidden";

    if (!caption) {
      return null;
    }

    var infoUrlText =
      this.state.infoUrlText && this.state.infoUrlText.length
        ? this.state.infoUrlText
        : this.state.infoUrl;

    return (
      <div className="panel panel-default layer-item">
        <div className="panel-heading unselectable" onClick={toggleLegend}>
          <span onClick={toggleVisible} className="clickable">
            <i className="material-icons" style={{ width: "2rem" }}>
              {visible ? "checkbox" : "check_box_outline_blank"}
            </i>
            {this.renderStatus()}
            <label
              className={
                visible
                  ? "layer-item-header-text active-group"
                  : "layer-item-header-text"
              }
            >
              {caption}
            </label>
          </span>
          {components.legend.legendButton}

          <span onClick={infoVisible ? toggleInfo : null}>
            {infoVisible ? components.legend.infoButton : null}
          </span>
        </div>
        <div className={innerInfoBodyClass}>
          <p
            className="info-title"
            dangerouslySetInnerHTML={{ __html: this.state.infoTitle }}
          />
          <p
            className="info-text"
            dangerouslySetInnerHTML={{ __html: this.state.infoText }}
          />
          <a
            className="info-text"
            href={this.state.infoUrl}
            target="_blank"
            dangerouslySetInnerHTML={{ __html: infoUrlText }}
          />
          <p
            className="info-text"
            dangerouslySetInnerHTML={{ __html: this.state.infoOwner }}
          />
        </div>

        <div className={innerBodyClass}>
          {expanded ? components.legend.legendPanel : null}
        </div>

        <Typography id="label">Opacity</Typography>
        <Slider
          value={opacityValue}
          min={0}
          max={1}
          step={0.1}
          aria-labelledby="label"
          onChange={this.handleChange}
          onDragEnd={this.handleDragEnd}
        />
      </div>
    );
  }
}

export default LayerItem;
