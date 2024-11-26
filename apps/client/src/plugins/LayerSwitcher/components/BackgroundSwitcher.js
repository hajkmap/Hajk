import React from "react";
import propTypes from "prop-types";
import { isValidLayerId } from "../../../utils/Validator";
import OSM from "ol/source/OSM";
import TileLayer from "ol/layer/Tile";
import BackgroundLayerItem from "./BackgroundLayerItem";
import Box from "@mui/material/Box";

const WHITE_BACKROUND_LAYER_ID = "-1";
const BLACK_BACKROUND_LAYER_ID = "-2";
const OSM_BACKGROUND_LAYER_ID = "-3";

const SPECIAL_BACKGROUND_COLORS = {
  [WHITE_BACKROUND_LAYER_ID]: "#fff",
  [BLACK_BACKROUND_LAYER_ID]: "#000",
  [OSM_BACKGROUND_LAYER_ID]: "#fff",
};

const createFakeMapLayer = ({ name, caption, checked }) => ({
  isFakeMapLayer: true,
  properties: {
    name,
    visible: checked,
    caption,
    layerInfo: {
      caption: caption,
      name: name,
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
});

const isSpecialBackgroundLayer = (id) => {
  return [
    WHITE_BACKROUND_LAYER_ID,
    BLACK_BACKROUND_LAYER_ID,
    OSM_BACKGROUND_LAYER_ID,
  ].includes(id);
};

const isOSMLayer = (id) => id === OSM_BACKGROUND_LAYER_ID;

const setSpecialBackground = (id) => {
  document.getElementById("map").style.backgroundColor =
    SPECIAL_BACKGROUND_COLORS[id];
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
    globalObserver: propTypes.object,
  };
  constructor(props) {
    super(props);
    if (props.enableOSM) {
      this.osmSource = new OSM({
        reprojectionErrorThreshold: 5,
      });
      this.osmLayer = new TileLayer({
        visible: false,
        source: this.osmSource,
        zIndex: -1,
        layerType: "base",
        rotateMap: "n", // OpenStreetMap should be rotated to North
        name: "osm-layer",
        caption: "OpenStreetMap",
        layerInfo: {
          caption: "OpenStreetMap",
          layerType: "base",
        },
      });
      this.osmLayer.on("change:visible", (e) => {
        // Publish event to ensure DrawOrder tab is updated with osmLayer changes
        this.props.globalObserver.publish("core.layerVisibilityChanged", e);
      });
    }

    const initialBg = Object.entries(this.props.layerMap)
      .find(([_, l]) => l.get("layerType") === "base" && l.get("visible"))
      ?.get("name");

    this.state.selectedLayerId = initialBg ?? OSM_BACKGROUND_LAYER_ID;
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
    this.props.globalObserver.subscribe(
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

  /**
   * @summary Hides previously selected background and shows current selection.
   * @param {Object} e The event object, contains target's value
   */
  onLayerClick = (newSelectedId) => {
    const prevSelectedLayerId = this.state.selectedLayerId;
    const { layerMap } = this.props;

    this.setState({
      selectedLayerId: newSelectedId,
    });

    // Publish event to ensure all other background layers are disabled
    this.props.globalObserver.publish(
      "layerswitcher.backgroundLayerChanged",
      newSelectedId
    );

    console.log({ newSelectedId, prevSelectedLayerId });
    if (isSpecialBackgroundLayer(newSelectedId)) {
      if (isOSMLayer(newSelectedId)) {
        const osmLayer = this.props.map
          .getAllLayers()
          .find((l) => l.get("name") === "osm-layer");
        osmLayer.setVisible(true);
      } else {
        setSpecialBackground(newSelectedId);
      }
    } else {
      layerMap[newSelectedId].setVisible(true);
    }

    if (isSpecialBackgroundLayer(prevSelectedLayerId)) {
      if (isOSMLayer(prevSelectedLayerId)) {
        this.osmLayer.setVisible(false);
      }
    } else {
      layerMap[prevSelectedLayerId].setVisible(false);
    }
  };

  render() {
    const { backgroundSwitcherWhite, backgroundSwitcherBlack, enableOSM } =
      this.props;

    // TODO This filter should be moved to the core application.
    const layers = this.props.layers.filter((layer) => {
      //Remove layers not having a valid id
      const validLayerId = isValidLayerId(layer.name);

      if (!validLayerId) {
        console.warn(`Backgroundlayer with id ${layer.id} has a non-valid id`);
      }
      return validLayerId;
    });

    return (
      <Box sx={{ display: this.props.display ? "block" : "none" }}>
        {backgroundSwitcherWhite && (
          <BackgroundLayerItem
            index={Number(WHITE_BACKROUND_LAYER_ID)}
            key={Number(WHITE_BACKROUND_LAYER_ID)}
            selected={this.state.selectedLayerId === WHITE_BACKROUND_LAYER_ID}
            layer={createFakeMapLayer({
              name: WHITE_BACKROUND_LAYER_ID,
              caption: "Vit",
              checked: this.state.selectedLayerId === WHITE_BACKROUND_LAYER_ID,
            })}
            globalObserver={this.props.globalObserver}
            clickCallback={() => this.onLayerClick(WHITE_BACKROUND_LAYER_ID)}
          />
        )}

        {backgroundSwitcherBlack && (
          <BackgroundLayerItem
            index={Number(BLACK_BACKROUND_LAYER_ID)}
            key={Number(BLACK_BACKROUND_LAYER_ID)}
            selected={this.state.selectedLayerId === BLACK_BACKROUND_LAYER_ID}
            layer={createFakeMapLayer({
              name: BLACK_BACKROUND_LAYER_ID,
              caption: "Svart",
              checked: this.state.selectedLayerId === BLACK_BACKROUND_LAYER_ID,
            })}
            globalObserver={this.props.globalObserver}
            clickCallback={() => this.onLayerClick(BLACK_BACKROUND_LAYER_ID)}
          />
        )}

        {enableOSM && (
          <BackgroundLayerItem
            index={Number(OSM_BACKGROUND_LAYER_ID)}
            key={Number(OSM_BACKGROUND_LAYER_ID)}
            selected={isOSMLayer(this.state.selectedLayerId)}
            layer={this.osmLayer}
            globalObserver={this.props.globalObserver}
            clickCallback={() => this.onLayerClick(OSM_BACKGROUND_LAYER_ID)}
          />
        )}
        {layers.map((layerConfig, i) => (
          <BackgroundLayerItem
            index={i}
            key={layerConfig.name}
            selected={this.state.selectedLayerId === layerConfig.name}
            layer={this.props.layerMap[layerConfig.name]}
            globalObserver={this.props.globalObserver}
            clickCallback={() => this.onLayerClick(layerConfig.name)}
          />
        ))}
      </Box>
    );
  }
}

export default BackgroundSwitcher;
