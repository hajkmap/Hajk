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

/**
 * @summary Returns a <div> that contains a {React.Component} consisting of one Radio button.
 *
 * @param {Object} config Base layer to be rendered
 * @param {Number} index Unique key
 * @returns {React.Component}
 * @memberof BackgroundSwitcher
 */
const BaseLayerContainer = ({
  config,
  index,
  selectedLayerId,
  mapLayer,
  osmLayer,
  app,
}) => {
  // const checked = this.state.selectedLayerId === config.name;
  const checked = selectedLayerId === config.name;

  // mapLayer will be sent to the LayerItem component. It will contain
  // the Hajk layer with all properties.
  // let mapLayer = this.props.layerMap[config.name];

  // There's a special case for the OpenStreetMap layer. It does not exist
  // in Hajk's layers repository, but has been created here, as a property
  // of 'this'. Let's set mapLayer accordingly.
  if (config.name === OSM_BACKGROUND_LAYER_ID) {
    mapLayer = osmLayer;
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
        caption: config.caption,
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

  // Finally, let's render the component
  return (
    <BackgroundLayer
      key={index}
      layer={mapLayer}
      app={app}
      draggable={false}
      toggleable={true}
    ></BackgroundLayer>
  );
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

    const radioButtons = [
      ...this.props.layers.filter((layer) => {
        //Remove layers not having a valid id
        const validLayerId = isValidLayerId(layer.name);
        if (!validLayerId) {
          console.warn(
            `Backgroundlayer with id ${layer.name} has a non-valid id`
          );
        }
        return validLayerId;
      }),
    ];

    return (
      <Box sx={{ display: this.props.display ? "block" : "none" }}>
        {backgroundSwitcherWhite && (
          <BaseLayerContainer
            config={{
              name: WHITE_BACKROUND_LAYER_ID,
              caption: "Vit",
            }}
            index={Number(WHITE_BACKROUND_LAYER_ID)}
            key={Number(WHITE_BACKROUND_LAYER_ID)}
            selectedLayerId={this.state.selectedLayerId}
            mapLayer={undefined}
            app={this.props.app}
          />
        )}

        {backgroundSwitcherBlack && (
          <BaseLayerContainer
            config={{
              name: BLACK_BACKROUND_LAYER_ID,
              caption: "Svart",
            }}
            index={Number(BLACK_BACKROUND_LAYER_ID)}
            key={Number(BLACK_BACKROUND_LAYER_ID)}
            selectedLayerId={this.state.selectedLayerId}
            mapLayer={undefined}
            app={this.props.app}
          />
        )}

        {enableOSM && (
          <BaseLayerContainer
            config={{
              name: OSM_BACKGROUND_LAYER_ID,
              caption: "OpenStreetMap",
            }}
            index={Number(OSM_BACKGROUND_LAYER_ID)}
            key={Number(OSM_BACKGROUND_LAYER_ID)}
            selectedLayerId={this.state.selectedLayerId}
            mapLayer={undefined}
            app={this.props.app}
            osmLayer={this.osmLayer}
          />
        )}
        {radioButtons.map((layerConfig, i) => (
          <BaseLayerContainer
            config={layerConfig}
            index={i}
            key={layerConfig.name}
            selectedLayerId={this.state.selectedLayerId}
            mapLayer={this.props.layerMap[layerConfig.name]}
            app={this.props.app}
          />
        ))}
      </Box>
    );
  }
}

export default BackgroundSwitcher;
