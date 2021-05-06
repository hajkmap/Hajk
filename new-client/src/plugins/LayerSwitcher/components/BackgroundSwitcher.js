import React from "react";
import { withStyles } from "@material-ui/core/styles";
import propTypes from "prop-types";
import OSM from "ol/source/OSM";
import TileLayer from "ol/layer/Tile";
import LayerItem from "./LayerItem.js";
import Observer from "react-event-observer";
import { set } from "ol/transform";

const styles = (theme) => ({
  layerItemContainer: {
    borderBottom: `${theme.spacing(0.2)}px solid ${theme.palette.divider}`,
  },
  captionText: {
    position: "relative",
    top: "2px",
    fontSize: theme.typography.pxToRem(15),
  },
});

class BackgroundSwitcher extends React.PureComponent {
  state = {
    selectedLayer: -1, // By default, select special case "white background"
  };
  // A list is used since it is passed into LayerItem before the osmLayer is created (and thus no reference exists to it)
  osmLayer = [];

  static propTypes = {
    backgroundSwitcherBlack: propTypes.bool.isRequired,
    backgroundSwitcherWhite: propTypes.bool.isRequired,
    enableOSM: propTypes.bool.isRequired,
    classes: propTypes.object.isRequired,
    display: propTypes.bool.isRequired,
    layerMap: propTypes.object.isRequired,
    layers: propTypes.array.isRequired,
  };
  constructor(props) {
    super(props);
    this.localObserver = Observer();
  }

  /**
   * @summary If there's a Background layer that is visible from start, make sure that proper radio button is selected in Background Switcher.
   * @memberof BackgroundSwitcher
   */
  componentDidMount() {
    const backgroundVisibleFromStart = this.props.layers.find(
      (layer) => layer.visible
    );
    backgroundVisibleFromStart &&
      this.setState({
        selectedLayer: backgroundVisibleFromStart.name,
      });

    if (this.props.enableOSM) {
      // Initiate our special case layer, OpenStreetMap
      const osmSource = new OSM({
        reprojectionErrorThreshold: 5,
      });
      this.osmLayer.push(
        new TileLayer({
          visible: false,
          source: osmSource,
          zIndex: -1,
        })
      );
      this.props.map.addLayer(this.osmLayer[0]);
    }
  }

  /**
   * @summary Returns a <div> that contains a {React.Component} consisting of one Radio button.
   *
   * @param {Object} config Base layer to be rendered
   * @param {Number} index Unique key
   * @returns {React.Component}
   * @memberof BackgroundSwitcher
   */
  renderRadioButton(config, index) {
    let checked = this.state.selectedLayer === config.name;
    let mapLayer = this.props.layerMap[Number(config.name)];
    const { classes } = this.props;
    let options = this.props.options || {};
    if (!("enableTransparencySlider" in options)) {
      // Layersettings will crash if this is not present
      options["enableTransparencySlider"] = true;
    }

    if (!mapLayer) {
      const that = this;
      // Add some values so the code does not crash in LayerItem's constructor
      mapLayer = {
        isDefaultBackground: true,
        backgroundSpecialCaseId: config.name,
        properties: {
          name: config.caption,
          visible: checked,
          layerInfo: { caption: config.caption },
          opacity: 1,
        },

        get(key) {
          if (key === "opacity") {
            if (that.osmLayer.length > 0) {
              // the first the opacity is taken is before osmlayer is initialized
              return that.osmLayer[0].get("opacity");
            } else {
              return 1;
            }
          }
          return this.properties[key];
        },
        set(key, value) {
          this.properties[key] = value;
        },
        getProperties() {
          return Object.keys(this.properties);
        },
        setOpacity(value) {
          that.osmLayer[0].setOpacity(value);
        },
      };
      if (config.name === "-3") {
        mapLayer["osmLayer"] = this.osmLayer;
      }
    }
    mapLayer["localObserver"] = this.localObserver;
    mapLayer["isBackgroundLayer"] = true;

    return (
      <div key={index} className={classes.layerItemContainer}>
        <LayerItem
          key={index}
          layer={mapLayer}
          model={this.props.model}
          options={options}
          chapters={this.props.chapters}
          app={this.props.app}
          onOpenChapter={(chapter) => {
            const informativeWindow = this.props.app.windows.find(
              (window) => window.type === "informative"
            );
            informativeWindow.props.custom.open(chapter);
          }}
        />
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
      enableOSM,
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
            caption: "Vit",
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
            caption: "Svart",
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
      ),
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
