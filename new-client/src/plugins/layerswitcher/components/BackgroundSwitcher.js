import React from "react";
import { withStyles } from "@material-ui/core/styles";
import propTypes from "prop-types";

import Radio from "@material-ui/core/Radio";
import RadioButtonUncheckedIcon from "@material-ui/icons/RadioButtonUnchecked";
import RadioButtonCheckedIcon from "@material-ui/icons/RadioButtonChecked";

import OSM from "ol/source/OSM";
import TileLayer from "ol/layer/Tile";

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
  state = {
    selectedLayer: -1 // By default, select special case "white background"
  };

  osmLayer = undefined;

  static propTypes = {
    backgroundSwitcherBlack: propTypes.bool.isRequired,
    backgroundSwitcherWhite: propTypes.bool.isRequired,
    enableOSM: propTypes.bool.isRequired,
    classes: propTypes.object.isRequired,
    display: propTypes.bool.isRequired,
    layerMap: propTypes.object.isRequired,
    layers: propTypes.array.isRequired
  };

  /**
   * @summary If there's a Background layer that is visible from start, make sure that proper radio button is selected in Background Switcher.
   * @memberof BackgroundSwitcher
   */
  componentDidMount() {
    const backgroundVisibleFromStart = this.props.layers.find(
      layer => layer.visible
    );
    backgroundVisibleFromStart &&
      this.setState({
        selectedLayer: backgroundVisibleFromStart.name
      });

    // Initiate our special case layer, OpenStreetMap
    const osmSource = new OSM({
      reprojectionErrorThreshold: 5
    });
    this.osmLayer = new TileLayer({
      visible: false,
      source: osmSource,
      zIndex: -1
    });
    this.props.map.addLayer(this.osmLayer);
  }
  /**
   * @summary Hides previously selected background and shows current selection.
   * @param {Object} e The event object, contains target's value
   */
  onChange = e => {
    const selectedLayer = e.target.value;

    // Hide previously selected layers. The if > 0 is needed because we have our
    // special cases (black and white backgrounds), that don't exist in our layerMap,
    // and that would cause problem when we try to call .setVisible() on them.
    Number(this.state.selectedLayer) > 0 &&
      this.props.layerMap[Number(this.state.selectedLayer)].setVisible(false);

    // Also, take care of hiding our OSM layer
    this.osmLayer.setVisible(false);

    // Make the currently clicked layer visible, but also handle our special cases.
    Number(selectedLayer) > 0 &&
      this.props.layerMap[Number(selectedLayer)].setVisible(true);

    // Take care of our special cases: negative values are reserved for them
    selectedLayer === "-2" &&
      (document.getElementById("map").style.backgroundColor = "#000");
    selectedLayer === "-1" &&
      (document.getElementById("map").style.backgroundColor = "#FFF");

    // Another special case is the OSM layer
    selectedLayer === "-3" && this.osmLayer.setVisible(true);

    // Finally, store current selection in state
    this.setState({
      selectedLayer
    });
  };

  /**
   * @summary Returns a <div> that contains a {React.Component} consisting of one Radio button.
   *
   * @param {Object} config Base layer to be rendered
   * @param {Number} index Unique key
   * @returns {React.Component}
   * @memberof BackgroundSwitcher
   */
  renderRadioButton(config, index) {
    let caption;
    let checked = this.state.selectedLayer === config.name;
    const mapLayer = this.props.layerMap[Number(config.name)];
    const { classes } = this.props;

    if (mapLayer) {
      caption = mapLayer.get("layerInfo").caption;
    } else {
      caption = config.caption;
    }

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

  /**
   * Prepares an array of radio buttons with the configured base layers.
   *
   * @returns {React.Component[]} radioButtons Array of ready to use DOM components of Radio buttons
   * @memberof BackgroundSwitcher
   */
  renderBaseLayerComponents() {
    const {
      backgroundSwitcherWhite,
      backgroundSwitcherBlack,
      enableOSM
    } = this.props;
    let radioButtons = [],
      defaults = [];

    /**
     * If admin wants to display white/black options for background, let's
     * call renderRadioButton() for those two special cases. The resulting
     * Component will be pushed into an array called @param defaults.
     */
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

    enableOSM &&
      defaults.push(
        this.renderRadioButton({ name: "-3", caption: "OpenStreetMap" }, -3)
      );

    /**
     * Let's construct the final array of radio buttons. It will consists
     * of the defaults from above, plus the result of calling renderRadioButton()
     * for each base layer.
     */
    radioButtons = [
      ...defaults,
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
