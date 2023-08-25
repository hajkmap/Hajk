import React, { useEffect } from "react";
import { Button, ListItem, ToggleButton, Typography } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import { getMergedSearchAndHashParams } from "utils/getMergedSearchAndHashParams";

const FeatureItem = (props) => {
  console.log("props: ", props);
  const id = props.feature.get("id");
  const layer = props.feature.get("layer");
  const caption = props.feature.get("caption");

  const { clickedPointsCoordinates, globalObserver } = props;

  const [olLayer] = React.useState(() =>
    props.olMap.getAllLayers().find((l) => l.get("name") === id)
  );

  const triggerGetFeatureInfo = () => {
    console.log("Will trigger GetFeatureInfo for ", clickedPointsCoordinates);
  };

  const isLayerVisible = () => {
    if (olLayer.get("layerType") === "group") {
      return (
        olLayer.getVisible() &&
        olLayer.getSource().getParams()["LAYERS"].split(",").includes(layer)
      );
    } else {
      return olLayer.getVisible();
    }
  };

  // Determine state from current visibility
  const [selected, setSelected] = React.useState(isLayerVisible);

  const layerVisibilityChanged = (e) => {
    if (e.oldValue === false) {
      // Layer became visible, ensure its toggle button state
      // is set to true
      setSelected(true);
    } else {
      setSelected(false);
    }
  };

  // Let's listen to layer's own onChange event. This allows
  // us to reflect the current visibility state in our list.
  React.useEffect(() => {
    olLayer.on("change:visible", layerVisibilityChanged);
    // Cleanup function can be created as follows:
    return () => {
      olLayer.un("change:visible", layerVisibilityChanged);
    };
  }, [olLayer]);

  useEffect(() => {
    // Grab current state from URL hash
    const mergedParams = getMergedSearchAndHashParams();

    // Let's convert the string of IDs to a Set, which
    // ensures elements' uniqueness in the array.
    const visibleLayers = new Set(
      mergedParams
        .get("l")
        .split(",")
        .map((l) => l.trim())
        .filter((l) => l.length)
    );

    // Do the same with the gl string that can contain group
    // layers. Ensure we don't try to parse null.
    const visibleSubLayers = new Map(
      Object.entries(JSON.parse(mergedParams.get("gl") || "{}"))
    );

    // We'll need this check a couple of time, let's save
    // some keystrokes.
    const layerIsGroupLayer = olLayer.get("layerType") === "group";

    if (selected === true) {
      // Ensure that layer's ID is added to the list of layers to show
      visibleLayers.add(id);

      if (layerIsGroupLayer) {
        // Also, ensure that the group layer is added to list
        // Ensure that the current layer's ID really exists in our Map
        if (!visibleSubLayers.has(id)) {
          visibleSubLayers.set(id, "");
        }

        visibleSubLayers.set(
          id,
          Array.from(
            new Set(
              visibleSubLayers
                .get(id)
                .split(",")
                .map((l) => l.trim())
                .filter((l) => l.length)
            ).add(layer)
          ).join(",")
        );
      }
    } else {
      let remainingSubLayers = [];
      if (layerIsGroupLayer) {
        // Remove the sublayer from group
        remainingSubLayers = Array.from(
          new Set(
            visibleSubLayers
              .get(id)
              .split(",")
              .map((l) => l.trim())
              .filter((l) => l.length)
          ).delete(layer)
        ).join(",");

        visibleSubLayers.set(id, remainingSubLayers);
      }
      // If this was the last sublayer from this layer, let's
      // remove the entire layer too
      console.log("remainingSubLayers: ", remainingSubLayers);
      if (remainingSubLayers.length === 0) {
        visibleLayers.delete(id);
        visibleSubLayers.delete(id);
      }
    }
    console.log("visibleLayers 2: ", visibleLayers);
    // Convert back the Map and Set to strings, which is
    // the format `setLayerVisibilityFromParams` expects.
    const l = Array.from(visibleLayers).join(",");
    console.log("l: ", l);
    const gl = JSON.stringify(Object.fromEntries(visibleSubLayers));
    console.log("gl: ", gl);
    globalObserver.publish("core.setLayerVisibilityFromParams", {
      l,
      gl,
    });
    /*

    // Prepare the new string to send…
    const params = olLayer.get("layerType") === "group" ? [id, layer] : [id];
    // this.appModel.setLayerVisibilityFromParams(
    //   ...params
    // );
    if (selected === true) {
      console.log("SHOW", id, layer);
      // if (olLayer.get("layerType") === "group") {
      //   // Group layers will publish an event to LayerSwitcher that will take
      //   // care of the somewhat complicated toggling.

      //   // N.B. We don't want to hide any sublayers, only ensure that new ones are shown.
      //   // So the first step is to find out which sublayers are already visible.
      //   const alreadyVisibleSubLayers = olLayer
      //     .getSource()
      //     .getParams()
      //     ["LAYERS"].split(",")
      //     .filter((e) => e.length !== 0);
      //   console.log("alreadyVisibleSubLayers: ", alreadyVisibleSubLayers);
      //   console.log("olLayer.subLayers: ", olLayer.subLayers);

      //   // Next, prepare an array of the already visible layers, plus the new one.
      //   // Make sure NOT TO CHANGE THE ORDER of sublayers. Hence no push or spread,
      //   // only a filter on the admin-specified order that we have in the 'subLayers'
      //   // property.
      //   const subLayersToShow = olLayer.subLayers.filter((l) => {
      //     return alreadyVisibleSubLayers.includes(l) || l === layer;
      //   });

      //   console.log("subLayersToShow: ", subLayersToShow);
      //   // Finally, let's publish the event so that LayerSwitcher can take care of the rest
      //   // globalObserver.publish("layerswitcher.showLayer", {
      //   //   layer: olLayer,
      //   //   subLayersToShow,
      //   // });
      // } else {
      //   // "Normal" layers are easier, we can just toggle the visibility directly.
      //   // The already existing OL listener will update checkbox state on corresponding layer.
      //   globalObserver.publish("layerswitcher.showLayer", olLayer);
      //   // olLayer.setVisible(true);
      // }
    } else {
      console.log("HIDE", id, layer);

      // if (olLayer.get("layerType") === "group") {
      //   globalObserver.publish("layerswitcher.hideLayer", olLayer);
      // } else {
      //   olLayer.setVisible(false);
      // }
      
    }*/
  }, [layer, olLayer, selected, id, globalObserver]);

  return (
    <ListItem>
      <ToggleButton
        value="check"
        selected={selected}
        onChange={() => {
          setSelected(!selected);
        }}
      >
        <CheckIcon />
      </ToggleButton>
      <Typography>{caption}</Typography>
      <Button onClick={triggerGetFeatureInfo}>
        <CheckIcon />
      </Button>
    </ListItem>
  );
};

export default FeatureItem;
