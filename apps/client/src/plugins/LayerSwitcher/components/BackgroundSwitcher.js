import React from "react";
import propTypes from "prop-types";
import { isValidLayerId } from "../../../utils/Validator";
import OSM from "ol/source/OSM";
import TileLayer from "ol/layer/Tile";
import BackgroundLayer from "./BackgroundLayer";
import Box from "@mui/material/Box";

const WHITE_BACKROUND_LAYER_ID = "-1";
const BLACK_BACKROUND_LAYER_ID = "-2";
const OSM_BACKGROUND_LAYER_ID = "-3";

const SPECIAL_BACKGROUND_COLORS = {
  [WHITE_BACKROUND_LAYER_ID]: "#fff",
  [BLACK_BACKROUND_LAYER_ID]: "#000",
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
    if (props.enableOSM) {
      this.osmSource = new OSM({
        reprojectionErrorThreshold: 5,
      });
      this.osmLayer = new TileLayer({
        visible: true,
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
        this.props.app.globalObserver.publish("core.layerVisibilityChanged", e);
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

  render() {
    const { backgroundSwitcherWhite, backgroundSwitcherBlack, enableOSM } =
      this.props;

    // TODO This filter should be moved to the core application.
    const layers = this.props.layers.filter((layer) => {
      //Remove layers not having a valid id
      const validLayerId = isValidLayerId(layer.name);

      console.log(layer.name, validLayerId);
      if (!validLayerId) {
        console.warn(`Backgroundlayer with id ${layer.id} has a non-valid id`);
      }
      return validLayerId;
    });

    return (
      <Box sx={{ display: this.props.display ? "block" : "none" }}>
        {backgroundSwitcherWhite && (
          <BackgroundLayer
            index={Number(WHITE_BACKROUND_LAYER_ID)}
            key={Number(WHITE_BACKROUND_LAYER_ID)}
            selectedLayerId={this.state.selectedLayerId}
            layer={createFakeMapLayer({
              name: WHITE_BACKROUND_LAYER_ID,
              caption: "Vit",
              checked: this.state.selectedLayerId === WHITE_BACKROUND_LAYER_ID,
            })}
            app={this.props.app}
          />
        )}

        {backgroundSwitcherBlack && (
          <BackgroundLayer
            index={Number(BLACK_BACKROUND_LAYER_ID)}
            key={Number(BLACK_BACKROUND_LAYER_ID)}
            selectedLayerId={this.state.selectedLayerId}
            layer={createFakeMapLayer({
              name: BLACK_BACKROUND_LAYER_ID,
              caption: "Svart",
              checked: this.state.selectedLayerId === BLACK_BACKROUND_LAYER_ID,
            })}
            app={this.props.app}
          />
        )}

        {enableOSM && (
          <BackgroundLayer
            index={Number(OSM_BACKGROUND_LAYER_ID)}
            key={Number(OSM_BACKGROUND_LAYER_ID)}
            selectedLayerId={this.state.selectedLayerId}
            layer={this.osmLayer}
            app={this.props.app}
          />
        )}
        {layers.map((layerConfig, i) => (
          <BackgroundLayer
            index={i}
            key={layerConfig.name}
            selectedLayerId={this.state.selectedLayerId}
            layer={this.props.layerMap[layerConfig.name]}
            app={this.props.app}
          />
        ))}
      </Box>
    );
  }
}

export default BackgroundSwitcher;
