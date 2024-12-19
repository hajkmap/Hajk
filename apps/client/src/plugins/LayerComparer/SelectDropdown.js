import React from "react";
import {
  Box,
  FormControl,
  InputLabel,
  ListSubheader,
  Select,
  MenuItem,
} from "@mui/material";

const SelectDropdown = (props) => {
  const {
    setter,
    value,
    counterValue,
    baseLayers = [],
    layers = [],
    chosenLayers = [],
    label,
  } = props;

  const handleChange = (setter, value) => {
    setter(value);
  };

  const chosenBaseLayers = chosenLayers.filter((l) => l.layerType === "base");
  const chosenRegularLayers = chosenLayers.filter((l) =>
    ["layer", "group"].includes(l.layerType)
  );

  return (
    <Box sx={{ minWidth: 120 }}>
      <FormControl fullWidth>
        <InputLabel id="layer-select-label">{label}</InputLabel>
        <Select
          labelId="layer-select-label"
          id="layer-select"
          label={label}
          value={value}
          onChange={(e) => handleChange(setter, e.target.value)}
        >
          <MenuItem value="">Inget lager valt</MenuItem>

          {chosenBaseLayers.length > 0 && [
            <ListSubheader key="chosen-base-header">
              Bakgrundslager
            </ListSubheader>,
            ...chosenBaseLayers.map((l, i) => (
              <MenuItem
                key={`chosen-base-${i}`}
                value={l.id}
                disabled={l.id === counterValue}
              >
                {l.label}
              </MenuItem>
            )),
          ]}

          {chosenRegularLayers.length > 0 && [
            <ListSubheader key="chosen-layer-header">Lager</ListSubheader>,
            ...chosenRegularLayers.map((l, i) => (
              <MenuItem
                key={`chosen-layer-${i}`}
                value={l.id}
                disabled={l.id === counterValue}
              >
                {l.label}
              </MenuItem>
            )),
          ]}

          {baseLayers.length > 0 && [
            <ListSubheader key="base-header">Bakgrundslager</ListSubheader>,
            ...baseLayers.map((l, i) => (
              <MenuItem
                key={`base-${i}`}
                value={l.id}
                disabled={l.id === counterValue}
              >
                {l.label}
              </MenuItem>
            )),
          ]}

          {layers.length > 0 && [
            <ListSubheader key="layer-header">Lager</ListSubheader>,
            ...layers.map((l, i) => (
              <MenuItem
                key={`layer-${i}`}
                value={l.id}
                disabled={l.id === counterValue}
              >
                {l.label}
              </MenuItem>
            )),
          ]}
        </Select>
      </FormControl>
    </Box>
  );
};

export default SelectDropdown;
