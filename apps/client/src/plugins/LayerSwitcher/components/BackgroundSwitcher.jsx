import { useEffect, useState, useCallback } from "react";
import { isValidLayerId } from "../../../utils/Validator";
import BackgroundLayerItem from "./BackgroundLayerItem";
import Box from "@mui/material/Box";
import { BACKGROUND_LAYER_IDS } from "../../../constants/backgroundLayers";
import { useLayerSwitcherDispatch } from "../LayerSwitcherProvider";

// The special/non-server background layer ids, used to reorder them to the
// bottom of the background list.
const SPECIAL_BACKGROUND_LAYER_IDS = Object.values(BACKGROUND_LAYER_IDS);

const BackgroundSwitcher = ({
  display,
  layerMap,
  layers,
  globalObserver,
  renderSpecialBackgroundsAtBottom = false,
}) => {
  // TODO Read the selectedLayerId from the `appStateInHash`
  const [selectedLayerId, setSelectedLayerId] = useState(null);

  const layerSwitcherDispatch = useLayerSwitcherDispatch();

  // Sets the bg color of the map element to match the selected background.
  // Declared before the effects below so they can call it and list it as a
  // dependency without a use-before-declaration issue.
  const handleMapBackgroundColor = useCallback((selectedId) => {
    switch (selectedId) {
      // Our white option
      case BACKGROUND_LAYER_IDS.WHITE:
        document.getElementById("map").style.backgroundColor = "#fff";
        break;
      // Our black option
      case BACKGROUND_LAYER_IDS.BLACK:
        document.getElementById("map").style.backgroundColor = "#000";
        break;
      // Our default option for other background layers, default to white.
      default:
        document.getElementById("map").style.backgroundColor = "#fff";
        break;
    }
  }, []);

  useEffect(() => {
    const backgroundVisibleFromStart = layers.find((layer) => layer.visible);
    // Check that the background visible from start exists and not undefined
    // if b/w or osm is uncheked in admin and a user still tries to load it then do nothing
    if (backgroundVisibleFromStart) {
      // Syncs the initial radio selection from the layers' load-time visibility.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedLayerId(backgroundVisibleFromStart.name);
      handleMapBackgroundColor(backgroundVisibleFromStart.name);
    }
  }, [layers, handleMapBackgroundColor]);

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

        // If we got this far, we have a background layer that just became
        // visible. Notify the radio buttons by setting state, and repaint the
        // map background so toggles from outside the LayerSwitcher (URL hash,
        // LayerControlModel, other plugins) get the white/black fill too.
        setSelectedLayerId(name);
        handleMapBackgroundColor(name);
      }
    );
  }, [globalObserver, layers, handleMapBackgroundColor]);

  /**
   * @summary Hides previously selected background and shows current selection.
   * @param {Object} e The event object, contains target's value
   */
  const onLayerClick = useCallback(
    (newSelectedId) => {
      setSelectedLayerId(newSelectedId);

      // Publish event to ensure all other background layers are disabled
      globalObserver.publish(
        "layerswitcher.backgroundLayerChanged",
        newSelectedId
      );
      handleMapBackgroundColor(newSelectedId);

      layerSwitcherDispatch.setBackgroundLayer(newSelectedId);
    },
    [globalObserver, layerSwitcherDispatch, handleMapBackgroundColor]
  );

  // TODO This filter should be moved to the core application.
  let layersToShow = layers.filter((layer) => {
    //Remove layers not having a valid id
    const validLayerId = isValidLayerId(layer.name);

    if (!validLayerId) {
      console.warn(`Backgroundlayer with id ${layer.id} has a non-valid id`);
    }
    return validLayerId;
  });

  // If the static layers b/w and osm should be shown last in the bg-layer list
  // reorder the array to accomodate that.
  if (renderSpecialBackgroundsAtBottom) {
    const staticLayersRange = SPECIAL_BACKGROUND_LAYER_IDS;
    const staticLayersToMove = layersToShow.filter((layer) =>
      staticLayersRange.includes(layer.name)
    );
    layersToShow = layersToShow.filter(
      (layer) => !staticLayersRange.includes(layer.name)
    );
    layersToShow.push(...staticLayersToMove);
  }

  return (
    <Box
      // This class is used to style specific elements when the tab is active
      // If you search for this class in the codebase, you can find related style-fixes.
      className={"ls-backgrounds-tab-view"}
      sx={[
        {
          position: "relative",
          height: "inherit",
          maxHeight: "inherit",
          overflowY: "auto",
        },
        display
          ? {
              display: "block",
            }
          : {
              display: "none",
            },
      ]}
    >
      {layersToShow.map((layerConfig, i) => (
        <BackgroundLayerItem
          index={i}
          key={layerConfig.name}
          selected={selectedLayerId === layerConfig.name}
          layer={layerMap[layerConfig.name]}
          globalObserver={globalObserver}
          clickCallback={onLayerClick}
          layerId={layerConfig.name}
          isFakeMapLayer={false}
        />
      ))}
    </Box>
  );
};

export default BackgroundSwitcher;
