import React, { useEffect } from "react";

import { ToggleButton, ToggleButtonGroup } from "@mui/material";

import LocationCityIcon from "@mui/icons-material/LocationCity";
import BorderInnerIcon from "@mui/icons-material/BorderInner";
import TravelExploreIcon from "@mui/icons-material/TravelExplore";

function QuickLayerTogglerButtons({ map, options }) {
  const [selectedButtons, setSelectedButtons] = React.useState(() => []);
  const handleToggleButtons = (event, newStates) => {
    setSelectedButtons(newStates);
  };

  useEffect(() => {
    // Helper: convert the string of IDs that comes from Admin into an Array
    // of real OL Layers.
    const getOlLayersFromIds = (ids) =>
      ids
        .split(",")
        .map((id) => map.getAllLayers().find((l) => l.get("name") === id))
        .filter((l) => l !== undefined);

    // Helper: set visibility for Array of OL Layers
    const setVisibilityForOlLayers = (layers, visibility) =>
      layers.forEach((l) => l.setVisible(visibility));

    // Grab relevant layers IDs from options
    const { buildingsLayerIds, bordersLayerIds, plansLayerIds } = options;

    // Prepare a collection for each type of layer that should be toggleble
    const layersCollection = {
      buildings: getOlLayersFromIds(buildingsLayerIds),
      borders: getOlLayersFromIds(bordersLayerIds),
      plans: getOlLayersFromIds(plansLayerIds),
    };

    // Let's loop the keys of layersCollection. Each key effectively
    // corresponds to a toggle button.
    Object.keys(layersCollection).forEach((button) => {
      // Call our helper that updates relevant layers' visibility
      setVisibilityForOlLayers(
        layersCollection[button], // OL Layers live here
        selectedButtons.includes(button) // Visibility is determined by toggle button status
      );
    });
  }, [map, options, selectedButtons]);

  return (
    <ToggleButtonGroup
      value={selectedButtons}
      onChange={handleToggleButtons}
      fullWidth
    >
      <ToggleButton
        value="buildings"
        size="small"
        placeholder="Visa/dölj byggnader"
      >
        <LocationCityIcon />
      </ToggleButton>
      <ToggleButton value="borders" size="small">
        <BorderInnerIcon />
      </ToggleButton>
      <ToggleButton value="plans" size="small">
        <TravelExploreIcon />
      </ToggleButton>
    </ToggleButtonGroup>
  );
}

export default QuickLayerTogglerButtons;
