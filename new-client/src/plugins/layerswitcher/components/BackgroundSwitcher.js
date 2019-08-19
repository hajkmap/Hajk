import React from "react";
import { withStyles } from "@material-ui/core/styles";
import Radio from "@material-ui/core/Radio";
import RadioButtonUncheckedIcon from "@material-ui/icons/RadioButtonUnchecked";
import RadioButtonCheckedIcon from "@material-ui/icons/RadioButtonChecked";

const styles = theme => ({
  layerItemContainer: {
    borderBottom: "1px solid #ccc"
  },
  captionText: {
    position: "relative",
    top: "2px",
    fontSize: theme.typography.pxToRem(15)
  }
});

class BackgroundSwitcher extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      selectedLayer: -1
    };
  }

  onChange = e => {
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
  };

  componentDidMount() {
    const { layers } = this.props;
    layers
      .filter(layer => layer.visible)
      .forEach((layer, i) => {
        if (i !== 0 && this.props.layerMap[Number(layer.name)]) {
          this.props.layerMap[Number(layer.name)].setVisible(false);
        } else {
          this.setState({
            selectedLayer: layer.name
          });
        }
      });
  }

  renderRadioButton(config, index) {
    var caption,
      checked,
      mapLayer = this.props.layerMap[Number(config.name)];

    const { classes } = this.props;

    if (mapLayer) {
      caption = mapLayer.get("layerInfo").caption;
    } else {
      caption = config.caption;
    }
    checked = this.state.selectedLayer === config.name;
    return (
      <div key={index} className={classes.layerItemContainer}>
        <Radio
          id={caption + "_" + index}
          checked={checked}
          onChange={this.onChange}
          value={config.name || config}
          color="default"
          name="backgroundLayer"
          icon={<RadioButtonUncheckedIcon fontSize="small" />}
          checkedIcon={<RadioButtonCheckedIcon fontSize="small" />}
        />
        <label htmlFor={caption + "_" + index} className={classes.captionText}>
          {caption}
        </label>
      </div>
    );
  }

  renderBaseLayerComponents() {
    const { backgroundSwitcherWhite, backgroundSwitcherBlack } = this.props;
    var radioButtons = [],
      defaults = [];

    if (backgroundSwitcherWhite) {
      defaults.push(
        this.renderRadioButton(
          {
            name: "-1",
            caption: "Vit"
          },
          -1
        )
      );
    }
    if (backgroundSwitcherBlack) {
      defaults.push(
        this.renderRadioButton(
          {
            name: "-2",
            caption: "Svart"
          },
          -2
        )
      );
    }

    radioButtons = [...radioButtons, ...[defaults]];

    radioButtons = [
      ...radioButtons,
      ...this.props.layers.map((layerConfig, i) =>
        this.renderRadioButton(layerConfig, i)
      )
    ];

    return radioButtons;
  }

  render() {
    return (
      <div style={{ display: this.props.display ? "block" : "none" }}>
        {this.renderBaseLayerComponents()}
      </div>
    );
  }
}

export default withStyles(styles)(BackgroundSwitcher);
