import { useEffect, useState } from "react";

import useSnackbar from "../../hooks/useSnackbar";

const layerUsesMinMaxZoom = (minZoom, maxZoom) => {
  const minZ = minZoom ?? 0;
  const maxZ = maxZoom ?? 0;
  return (maxZ > 0 && maxZ < Infinity) || (minZ > 0 && minZ < Infinity);
};

export const useLayerZoomWarningSnackbar = (
  layerMinZoom,
  layerMaxZoom,
  toggled,
  visible,
  minMaxZoomAlertOnToggleOnly,
  layerId,
  caption
) => {
  const { addToSnackbar, removeFromSnackbar } = useSnackbar();
  const [prevVisible, setPrevVisible] = useState(visible);
  const [prevToggled, setPrevToggled] = useState(toggled);

  console.log("useLayerZoom", {
    layerMinZoom,
    layerMaxZoom,
    visible,
    layerId,
    caption,
  });

  // TODO Sublayers
  // TODO Hide snackbar if zoom such that the layer is visible again
  useEffect(() => {
    if (layerUsesMinMaxZoom(layerMinZoom, layerMaxZoom)) {
      // show warning on layer toggle
      if (toggled !== prevToggled) {
        if (visible) {
          removeFromSnackbar(layerId, caption);
        } else {
          if (toggled) {
            addToSnackbar(layerId, caption);
          }
        }
        setPrevToggled(toggled);
      }

      // Show warning on zoom in/out
      if (visible !== prevVisible) {
        if (visible) {
          removeFromSnackbar(layerId, caption);
        } else {
          if (!minMaxZoomAlertOnToggleOnly) {
            addToSnackbar(layerId, caption);
          }
        }
        setPrevVisible(visible);
      }
    }
  }, [
    addToSnackbar,
    removeFromSnackbar,
    layerId,
    caption,
    layerMinZoom,
    layerMaxZoom,
    visible,
    prevVisible,
    toggled,
    prevToggled,
    minMaxZoomAlertOnToggleOnly,
  ]);
};
