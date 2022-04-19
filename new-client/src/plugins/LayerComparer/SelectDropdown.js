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
  const { setter, value, counterValue, baseLayers, layers, label } = props;

  const handleChange = (setter, value) => {
    setter(value);
  };

  return (
    <Box sx={{ minWidth: 120 }}>
      <FormControl fullWidth>
        <InputLabel id="layer-1-label">{label}</InputLabel>
        <Select
          labelId="layer-1-label"
          id="layer-1-select"
          label="Lager 1"
          value={value}
          onChange={(e) => handleChange(setter, e.target.value)}
        >
          <MenuItem value="">Inget lager valt</MenuItem>
          <ListSubheader>Bakgrundslager</ListSubheader>
          {baseLayers.map((l, i) => {
            return (
              <MenuItem key={i} value={l.id} disabled={l.id === counterValue}>
                {l.label}
              </MenuItem>
            );
          })}
          <ListSubheader>Lager</ListSubheader>
          {layers.map((l, i) => {
            return (
              <MenuItem key={i} value={l.id}>
                {l.label}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>
    </Box>
  );
};

export default SelectDropdown;
