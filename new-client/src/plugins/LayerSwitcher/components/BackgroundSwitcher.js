import React from "react";
import propTypes from "prop-types";
import { isValidLayerId } from "utils/Validator";
import OSM from "ol/source/OSM";
import TileLayer from "ol/layer/Tile";
import LayerItem from "./LayerItem.js";
import Observer from "react-event-observer";
import Box from "@mui/material/Box";

const WHITE_BACKROUND_LAYER_ID = "-1";
const BLACK_BACKROUND_LAYER_ID = "-2";
const OSM_BACKGROUND_LAYER_ID = "-3";

const SPECIAL_BACKGROUND_COLORS = {
  [WHITE_BACKROUND_LAYER_ID]: "#fff",
  [BLACK_BACKROUND_LAYER_ID]: "#000",
};

class BackgroundSwitcher extends React.PureComponent {
  state = {
    selectedLayerId: null,
  };

  static propTypes = {
    backgroundSwitcherBlack: propTypes.bool.isRequired,
    backgroundSwitcherWhite: propTypes.bool.isRequired,
    enableOSM: propTypes.bool.isRequired,
    display: propTypes.bool.isRequired,
    layerMap: propTypes.object.isRequired,
    layers: propTypes.array.isRequired,
  };
  constructor(props) {
    super(props);
    this.localObserver = Observer();
    if (props.enableOSM) {
      this.osmSource = new OSM({
        reprojectionErrorThreshold: 5,
      });
      this.osmLayer = new TileLayer({
        visible: false,
        source: this.osmSource,
        zIndex: -1,
        layerType: "base",
        name: "osm-layer",
        caption: "OpenStreetMap",
        layerInfo: {
          caption: "OpenStreetMap",
          layerType: "base",
        },
      });
      this.osmLayer.on("change:visible", (e) => {
        // osmLayer active state always changes when visibility changes
        e.target.set("active", e.target.get("visible"));
        // Publish event to ensure active tab is updated with osmLayer changes
        this.props.app.globalObserver.publish("core.layerActiveChanged", e);
      });
    }
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
        selectedLayerId: backgroundVisibleFromStart.name,
      });

    if (this.props.enableOSM) {
      // Initiate our special case layer, OpenStreetMap
      this.props.map.addLayer(this.osmLayer);
    }

    // Ensure that BackgroundSwitcher correctly selects visible layer,
    // by listening to a event that each layer will send when its visibility
    // changes.
    this.props.app.globalObserver.subscribe(
      "core.layerVisibilityChanged",
      ({ target: layer }) => {
        const name = layer.get("name");

        // Early return if layer who's visibility was changed couldn't
        // be found among the background layers, or if the visibility
        // was changed to 'false'.
        if (
          this.props.layers.findIndex((l) => name === l.name) === -1 ||
          layer.get("visible") === false
        ) {
          return;
        }

        // If we got this far, we have a background layer that just
        // became visible. Let's notify the radio buttons by setting state!
        this.setState({
          selectedLayerId: layer.get("name"),
        });
      }
    );
  }

  isSpecialBackgroundLayer = (id) => {
    return [
      WHITE_BACKROUND_LAYER_ID,
      BLACK_BACKROUND_LAYER_ID,
      OSM_BACKGROUND_LAYER_ID,
    ].includes(id);
  };

  setSpecialBackground = (id) => {
    document.getElementById("map").style.backgroundColor =
      SPECIAL_BACKGROUND_COLORS[id];
  };

  /**
   * @summary Hides previously selected background and shows current selection.
   * @param {Object} e The event object, contains target's value
   */
  onChange = (e) => {
    const newSelectedId = e.target.value;
    const { selectedLayerId } = this.state;
    const { layerMap } = this.props;

    this.isSpecialBackgroundLayer(newSelectedId)
      ? this.setSpecialBackground(newSelectedId)
      : layerMap[newSelectedId].setVisible(true);

    !this.isSpecialBackgroundLayer(selectedLayerId) &&
      layerMap[selectedLayerId].setVisible(false);
    this.osmLayer &&
      this.osmLayer.setVisible(newSelectedId === OSM_BACKGROUND_LAYER_ID);

    this.setState({
      selectedLayerId: newSelectedId,
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
    const checked = this.state.selectedLayerId === config.name;

    // mapLayer will be sent to the LayerItem component. It will contain
    // the Hajk layer with all properties.
    let mapLayer = this.props.layerMap[config.name];

    // There's a special case for the OpenStreetMap layer. It does not exist
    // in Hajk's layers repository, but has been created here, as a property
    // of 'this'. Let's set mapLayer accordingly.
    if (config.name === OSM_BACKGROUND_LAYER_ID) {
      mapLayer = this.osmLayer;
      mapLayer.set("foo", "bar");
      // mapLayer.set("layerInfo", { layerType: "base" });
    }

    // If we still don't have any mapLayer it means it's neither existing in
    // Hajks layers repository, nor the OSM layer. (This will be the case for our
    // black and white background colors.) In this case, let's prepare a fake
    // 'mapLayer' that contains the necessary properties, so we can use the same
    // logic further on.
    if (!mapLayer) {
      // Add some values so the code does not crash in LayerItem's constructor
      mapLayer = {
        isFakeMapLayer: true,
        properties: {
          name: config.name,
          visible: checked,
          layerInfo: {
            caption: config.caption,
            name: config.name,
            layerType: "base",
          },
          opacity: 1, // Only full opacity available for black/white backgrounds
        },
        get(key) {
          return this.properties[key];
        },
        set(key, value) {
          this.properties[key] = value;
        },
        getProperties() {
          return Object.keys(this.properties);
        },
      };
    }

    // No matter the type of 'mapLayer', we want to append these
    // properties:
    mapLayer["localObserver"] = this.localObserver;

    // Finally, let's render the component
    return (
      <LayerItem
        key={index}
        layer={mapLayer}
        model={this.props.model}
        options={this.props.options}
        app={this.props.app}
      />
    );
  }

  /**
   * Prepares an array of radio buttons with the configured base layers.
   *
   * @returns {React.Component[]} radioButtons Array of ready to use DOM components of Radio buttons
   * @memberof BackgroundSwitcher
   */
  renderBaseLayerComponents() {
    const { backgroundSwitcherWhite, backgroundSwitcherBlack, enableOSM } =
      this.props;
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
            name: WHITE_BACKROUND_LAYER_ID,
            caption: "Vit",
          },
          Number(WHITE_BACKROUND_LAYER_ID)
        )
      );
    }
    if (backgroundSwitcherBlack) {
      defaults.push(
        this.renderRadioButton(
          {
            name: BLACK_BACKROUND_LAYER_ID,
            caption: "Svart",
          },
          Number(BLACK_BACKROUND_LAYER_ID)
        )
      );
    }

    enableOSM &&
      defaults.push(
        this.renderRadioButton(
          { name: OSM_BACKGROUND_LAYER_ID, caption: "OpenStreetMap" },
          Number(OSM_BACKGROUND_LAYER_ID)
        )
      );

    /**
     * Let's construct the final array of radio buttons. It will consists
     * of the defaults from above, plus the result of calling renderRadioButton()
     * for each base layer.
     */
    radioButtons = [
      ...defaults,
      ...this.props.layers
        .filter((layer) => {
          //Remove layers not having a valid id
          const validLayerId = isValidLayerId(layer.name);
          if (!validLayerId) {
            console.warn(
              `Backgroundlayer with id ${layer.name} has a non-valid id`
            );
          }
          return validLayerId;
        })
        .map((layerConfig, i) => this.renderRadioButton(layerConfig, i)),
    ];

    return radioButtons;
  }

  render() {
    return (
      <Box sx={{ display: this.props.display ? "block" : "none" }}>
        {this.renderBaseLayerComponents()}
      </Box>
    );
  }
}

export default BackgroundSwitcher;
