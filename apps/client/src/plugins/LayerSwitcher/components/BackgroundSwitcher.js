import React, { useRef, useEffect, useState } from "react";
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

const BackgroundSwitcher = ({
  backgroundSwitcherBlack,
  backgroundSwitcherWhite,
  enableOSM,
  display,
  layerMap,
  layers,
  globalObserver,
  map,
}) => {
  const [selectedLayerId, setSelectedLayerId] = useState(null);

  const osmLayerRef = useRef(
    enableOSM &&
      new TileLayer({
        visible: false,
        source: new OSM({
          reprojectionErrorThreshold: 5,
        }),
        zIndex: -1,
        layerType: "base",
        rotateMap: "n", // OpenStreetMap should be rotated to North
        name: "osm-layer",
        caption: "OpenStreetMap",
        layerInfo: {
          caption: "OpenStreetMap",
          layerType: "base",
        },
      })
  );

  useEffect(() => {
    if (enableOSM) {
      osmLayerRef.current?.on("change:visible", (e) => {
        // Publish event to ensure DrawOrder tab is updated with osmLayer changes
        globalObserver.publish("core.layerVisibilityChanged", e);
      });
    }
  }, [globalObserver, enableOSM]);

  useEffect(() => {
    const backgroundVisibleFromStart = layers.find((layer) => layer.visible);
    backgroundVisibleFromStart &&
      setSelectedLayerId(backgroundVisibleFromStart.name);
  }, [layers]);

  useEffect(() => {
    if (enableOSM) {
      // Initiate our special case layer, OpenStreetMap
      map.addLayer(osmLayerRef.current);
    }
  }, [enableOSM, map]);

  useEffect(() => {
    // Ensure that BackgroundSwitcher correctly selects visible layer,
    // by listening to a event that each layer will send when its visibility
    // changes.
    globalObserver.subscribe(
      "core.layerVisibilityChanged",
      ({ target: layer }) => {
        const name = layer.get("name");

        // Early return if layer who's visibility was changed couldn't
        // be found among the background layers, or if the visibility
        // was changed to 'false'.
        if (
          layers.findIndex((l) => name === l.name) === -1 ||
          layer.get("visible") === false
        ) {
          return;
        }

        // If we got this far, we have a background layer that just
        // became visible. Let's notify the radio buttons by setting state!
        setSelectedLayerId(layer.get("name"));
      }
    );
  }, [globalObserver, layers]);

  /**
   * @summary Hides previously selected background and shows current selection.
   * @param {Object} e The event object, contains target's value
   */
  const onLayerClick = (newSelectedId) => () => {
    const prevSelectedLayerId = selectedLayerId;

    setSelectedLayerId(newSelectedId);

    // Publish event to ensure all other background layers are disabled
    globalObserver.publish(
      "layerswitcher.backgroundLayerChanged",
      newSelectedId
    );

    if (isSpecialBackgroundLayer(newSelectedId)) {
      if (isOSMLayer(newSelectedId)) {
        const osmLayer = map
          .getAllLayers()
          .find((l) => l.get("name") === "osm-layer");
        osmLayer.setVisible(true);
        setSpecialBackground(WHITE_BACKROUND_LAYER_ID);
      } else {
        setSpecialBackground(newSelectedId);
      }
    } else {
      // Reset the background to white
      setSpecialBackground(WHITE_BACKROUND_LAYER_ID);
      layerMap[newSelectedId].setVisible(true);
    }

    if (isSpecialBackgroundLayer(prevSelectedLayerId)) {
      if (isOSMLayer(prevSelectedLayerId)) {
        osmLayerRef.current.setVisible(false);
      }
    } else {
      // If the `enableAppStateInHash` setting is turned on and the page is
      // reloaded then prevSelectedLayerId will be null. I think the best way
      // to handle that case is to silently ignore this.
      layerMap[prevSelectedLayerId]?.setVisible(false);
    }
  };

  // TODO This filter should be moved to the core application.
  const layersToShow = layers.filter((layer) => {
    //Remove layers not having a valid id
    const validLayerId = isValidLayerId(layer.name);

    if (!validLayerId) {
      console.warn(`Backgroundlayer with id ${layer.id} has a non-valid id`);
    }
    return validLayerId;
  });

  return (
    <Box sx={{ display: display ? "block" : "none" }}>
      {backgroundSwitcherWhite && (
        <BackgroundLayerItem
          index={Number(WHITE_BACKROUND_LAYER_ID)}
          key={Number(WHITE_BACKROUND_LAYER_ID)}
          selected={selectedLayerId === WHITE_BACKROUND_LAYER_ID}
          layer={createFakeMapLayer({
            name: WHITE_BACKROUND_LAYER_ID,
            caption: "Vit",
            checked: selectedLayerId === WHITE_BACKROUND_LAYER_ID,
          })}
          globalObserver={globalObserver}
          clickCallback={onLayerClick(WHITE_BACKROUND_LAYER_ID)}
        />
      )}

      {backgroundSwitcherBlack && (
        <BackgroundLayerItem
          index={Number(BLACK_BACKROUND_LAYER_ID)}
          key={Number(BLACK_BACKROUND_LAYER_ID)}
          selected={selectedLayerId === BLACK_BACKROUND_LAYER_ID}
          layer={createFakeMapLayer({
            name: BLACK_BACKROUND_LAYER_ID,
            caption: "Svart",
            checked: selectedLayerId === BLACK_BACKROUND_LAYER_ID,
          })}
          globalObserver={globalObserver}
          clickCallback={onLayerClick(BLACK_BACKROUND_LAYER_ID)}
        />
      )}

      {enableOSM && (
        <BackgroundLayerItem
          index={Number(OSM_BACKGROUND_LAYER_ID)}
          key={Number(OSM_BACKGROUND_LAYER_ID)}
          selected={isOSMLayer(selectedLayerId)}
          layer={osmLayerRef.current}
          globalObserver={globalObserver}
          clickCallback={onLayerClick(OSM_BACKGROUND_LAYER_ID)}
        />
      )}
      {layersToShow.map((layerConfig, i) => (
        <BackgroundLayerItem
          index={i}
          key={layerConfig.name}
          selected={selectedLayerId === layerConfig.name}
          layer={layerMap[layerConfig.name]}
          globalObserver={globalObserver}
          clickCallback={onLayerClick(layerConfig.name)}
        />
      ))}
    </Box>
  );
};

export default BackgroundSwitcher;
