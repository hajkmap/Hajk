import React from "react";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";
import ExpandLessIcon from "@material-ui/icons/ExpandLess";

import "./BackgroundSwitcher.css";

class BackgroundSwitcher extends React.PureComponent {
  constructor() {
    super();
    this.onChange = this.onChange.bind(this);
    this.state = {
      selectedLayer: -1,
      toggled: true
    };
  }

  onChange(e) {
    if (Number(this.state.selectedLayer) > 0) {
      this.props.layerMap[Number(this.state.selectedLayer)].setVisible(false);
    }
    if (Number(e.target.value) > 0) {
      this.props.layerMap[Number(e.target.value)].setVisible(true);
    }

    if (e.target.value === "-2") {
      document.getElementById("map").style.backgroundColor = "#000";
    } else {
      document.getElementById("map").style.backgroundColor = "#FFF";
    }

    this.setState({
      selectedLayer: e.target.value
    });
  }

  componentWillMount() {
    this.props.layers
      .filter(layer => layer.visibleAtStart)
      .forEach((layer, i) => {
        if (i !== 0 && this.props.layerMap[Number(layer.id)]) {
          this.props.layerMap[Number(layer.id)].setVisible(false);
        } else {
          this.setState({
            selectedLayer: layer.id
          });
        }
      });
  }

  renderRadioButton(config, index) {
    var caption,
      checked,
      mapLayer = this.props.layerMap[Number(config.id)];

    if (mapLayer) {
      caption = mapLayer.get("layerInfo").caption;
    } else {
      caption = config.caption;
    }
    checked = this.state.selectedLayer === config.id;

    return (
      <div className="custom-control custom-radio" key={index}>
        <input
          type="radio"
          id={caption + "_" + index}
          name="background"
          className="custom-control-input"
          onChange={this.onChange.bind(this)}
          checked={checked}
          value={config.id || config}
        />
        <label className="custom-control-label" htmlFor={caption + "_" + index}>
          {caption}
        </label>
      </div>
    );
  }

  renderBaseLayerComponents() {
    var radioButtons = [];

    radioButtons = [
      ...radioButtons,
      ...[
        this.renderRadioButton(
          {
            id: "-1",
            caption: "Vit"
          },
          -1
        ),
        this.renderRadioButton(
          {
            id: "-2",
            caption: "Svart"
          },
          -2
        )
      ]
    ];

    radioButtons = [
      ...radioButtons,
      ...this.props.layers.map((layerConfig, i) =>
        this.renderRadioButton(layerConfig, i)
      )
    ];

    return radioButtons;
  }

  getVisibilityClass() {
    return this.state.toggled ? "layers-list hidden" : "layers-list";
  }

  toggleVisibility() {
    this.setState({ toggled: !this.state.toggled });
  }

  getToggleIcon() {
    return this.state.toggled ? <ChevronRightIcon /> : <ExpandLessIcon />;
  }

  render() {
    return (
      <div id="background-layers">
        <div className="expand-toggler">
          <h1
            onClick={() => {
              this.toggleVisibility();
            }}
            className="clickable"
          >
            {this.getToggleIcon()}
            Bakgrundskartor
          </h1>
        </div>
        <div className={this.getVisibilityClass()}>
          {this.renderBaseLayerComponents()}
        </div>
      </div>
    );
  }
}

export default BackgroundSwitcher;
