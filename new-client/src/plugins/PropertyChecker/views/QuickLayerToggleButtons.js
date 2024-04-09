import React, { useCallback, useEffect, useMemo } from "react";
import { styled } from "@mui/material/styles";

import { ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";

import LocationCityIcon from "@mui/icons-material/LocationCity";
import BorderInnerIcon from "@mui/icons-material/BorderInner";
import TravelExploreIcon from "@mui/icons-material/TravelExplore";
import { Box } from "@mui/system";
import HajkToolTip from "../../../components/HajkToolTip";

const StyledBox = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
}));

function QuickLayerTogglerButtons({ map, options }) {
  // Grab relevant layers IDs from options
  const { buildingsLayerIds, bordersLayerIds, plansLayerIds } = options;

  // Helper: Convert the string of IDs that comes from Admin into an Array
  // of real OL Layers.
  const getOlLayersFromIds = useCallback(
    (ids) =>
      ids
        .split(",")
        .map((id) => map.getAllLayers().find((l) => l.get("name") === id))
        .filter((l) => l !== undefined),
    [map]
  );

  // Prepare a collection for each type of layer that should be toggleble.
  // Memorize it as the values won't change through app's runtime.
  const layersCollection = useMemo(() => {
    return {
      buildings: getOlLayersFromIds(buildingsLayerIds),
      borders: getOlLayersFromIds(bordersLayerIds),
      plans: getOlLayersFromIds(plansLayerIds),
    };
  }, [buildingsLayerIds, bordersLayerIds, plansLayerIds, getOlLayersFromIds]);

  // Helper: Gets the initial state for our toggle buttons. It's possible
  // that the app starts with some of our quick layers already visible and
  // in that case, the toggle buttons should reflect that by already being enabled.
  const initialVisibilityForLayers = useMemo(() => {
    const initValue = [];

    Object.entries(layersCollection).forEach(([type, layer]) => {
      layer.map((l) => l.getVisible()).includes(true) && initValue.push(type);
    });

    return initValue;
  }, [layersCollection]);

  // Could be good to listen to the visibility change event too.
  // l.on("change:visible", (e) => {
  //   const newValue = !e.oldValue;
  //   if (newValue === true && !selectedButtons.includes(type)) {
  //     // Layer is to be switched on and isn't currently visible
  //     console.log(
  //       "selectedButtons.push(type): ",
  //       selectedButtons.push(type)
  //     );
  //     setSelectedButtons(selectedButtons.push(type));
  //   } else if (newValue === false && selectedButtons.includes(type)) {
  //     // Layer is to be hidden and is currently switched on
  //     setSelectedButtons(selectedButtons.filter((t) => t !== type));
  //   }
  // });

  const [selectedButtons, setSelectedButtons] = React.useState(
    initialVisibilityForLayers
  );

  const handleToggleButtons = (event, newStates) => {
    setSelectedButtons(newStates);
  };

  // When toggle button state changes, let's update layer's visibility.
  useEffect(() => {
    // Helper: Set visibility for Array of OL Layers.
    const setVisibilityForOlLayers = (layers, visibility) =>
      layers.forEach((l) => l.setVisible(visibility));

    // Let's loop the keys of layersCollection. Each key effectively
    // corresponds to a toggle button.
    Object.keys(layersCollection).forEach((button) => {
      // Call our helper that updates relevant layers' visibility
      setVisibilityForOlLayers(
        layersCollection[button], // OL Layers live here
        selectedButtons.includes(button) // Visibility is determined by toggle button status
      );
    });
  }, [layersCollection, selectedButtons]);

  return (
    <ToggleButtonGroup
      value={selectedButtons}
      onChange={handleToggleButtons}
      fullWidth
    >
      <ToggleButton value="buildings" size="small">
        <HajkToolTip title="Visa/dölj byggnader">
          <StyledBox>
            <LocationCityIcon />
            <Typography variant="button">Byggnader</Typography>
          </StyledBox>
        </HajkToolTip>
      </ToggleButton>
      <ToggleButton value="borders" size="small">
        <HajkToolTip title="Visa/dölj fastigheter">
          <StyledBox>
            <BorderInnerIcon />
            <Typography variant="button">Fastigheter</Typography>
          </StyledBox>
        </HajkToolTip>
      </ToggleButton>
      <ToggleButton value="plans" size="small">
        <HajkToolTip title="Visa/dölj planer">
          <StyledBox>
            <TravelExploreIcon />
            <Typography variant="button">Planer</Typography>
          </StyledBox>
        </HajkToolTip>
      </ToggleButton>
    </ToggleButtonGroup>
  );
}

export default QuickLayerTogglerButtons;
