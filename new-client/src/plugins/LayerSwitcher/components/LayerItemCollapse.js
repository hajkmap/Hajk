import React, { useState, useEffect } from "react";

import {
  Box,
  Collapse,
  IconButton,
  Slider,
  Typography,
  Stack,
} from "@mui/material";

import OpacityOutlinedIcon from "@mui/icons-material/OpacityOutlined";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import VectorFilter from "./VectorFilter";
import CQLFilter from "./CQLFilter";

export default function LayerItemCollapse({
  layer,
  showLegend,
  collapsed,
  showOpacity,
  cqlFilterVisible,
  subLayerIndex,
  options,
}) {
  // Keep the layer opacity in state
  const [opacity, setOpacity] = useState(layer.get("opacity"));
  // Keep selected area in state
  const [selectedArea, setSelectedArea] = useState(
    showLegend === false
      ? options?.enableTransparencySlider !== false && showOpacity
        ? "opacity"
        : "legend"
      : "legend"
  );

  // Handle opacity slider changes
  const handleOpacitySliderChange = (e, newValue) => {
    layer.set("opacity", newValue);
  };

  // Callback for change:opacity listeners
  const setOpacityCallback = (e) => {
    setOpacity(e.target.get("opacity"));
  };

  // Setup listeners when component is mounted
  useEffect(() => {
    // Register a listener: when layer's opacity changes make sure
    // to update opacity state. Not applicable for fakeMapLayers
    if (!layer.isFakeMapLayer) {
      layer.on("change:opacity", setOpacityCallback);
    }
    return function () {
      layer.un("change:opacity", setOpacityCallback);
    };
  }, [layer]);

  // Format slider label
  const valueLabelFormat = (value) => {
    return `${Math.trunc(value * 100)} %`;
  };

  const renderLegendImage = () => {
    const index = subLayerIndex ? subLayerIndex : 0;
    const layerInfo = layer.get("layerInfo");
    const src = layerInfo.legend?.[index]?.url ?? "";

    return src ? (
      <div>
        <img max-width="250px" alt="Teckenförklaring" src={src} />
      </div>
    ) : null;
  };

  const bgColor = "rgba(0, 0, 0, 0.04)";

  return (
    <Collapse
      in={collapsed}
      timeout="auto"
      unmountOnExit
      className="settingsCollapse"
    >
      <Box
        sx={{
          pl: 3,
          pr: 4,
          py: 1,
          borderBottom: (theme) =>
            `${theme.spacing(0.2)} solid ${theme.palette.divider}`,
        }}
      >
        <Stack sx={{ mb: 1 }} direction="row">
          {showLegend && (
            <IconButton
              sx={{ backgroundColor: selectedArea === "legend" ? bgColor : "" }}
              onClick={() => setSelectedArea("legend")}
            >
              <CategoryOutlinedIcon fontSize="small" />
            </IconButton>
          )}
          {options?.enableTransparencySlider !== false && showOpacity ? (
            <IconButton
              sx={{
                backgroundColor: selectedArea === "opacity" ? bgColor : "",
              }}
              onClick={() => setSelectedArea("opacity")}
            >
              <OpacityOutlinedIcon fontSize="small" />
            </IconButton>
          ) : null}
          {layer.getProperties().filterable ||
            (cqlFilterVisible && (
              <IconButton
                sx={{
                  backgroundColor: selectedArea === "filter" ? bgColor : "",
                }}
                onClick={() => setSelectedArea("filter")}
              >
                <FilterAltOutlinedIcon fontSize="small" />
              </IconButton>
            ))}
        </Stack>
        {selectedArea === "opacity" && (
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="subtitle2">Opacitet</Typography>
            <Slider
              aria-label="Layer opacity"
              value={opacity}
              onChange={handleOpacitySliderChange}
              getAriaValueText={valueLabelFormat}
              valueLabelFormat={valueLabelFormat}
              min={0}
              max={1}
              step={0.01}
              valueLabelDisplay="on"
            />
          </Stack>
        )}
        {selectedArea === "filter" &&
          (cqlFilterVisible && <CQLFilter layer={layer} />)(
            layer.getProperties().filterable && (
              <VectorFilter layer={layer}></VectorFilter>
            )
          )}
        {selectedArea === "legend" && renderLegendImage()}
      </Box>
    </Collapse>
  );
}
