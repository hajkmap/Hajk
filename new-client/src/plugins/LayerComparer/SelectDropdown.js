import React from "react";

import {
  Box,
  FormControl,
  InputLabel,
  ListSubheader,
  Select,
  MenuItem,
} from "@mui/material";
import { t } from "i18next";

const SelectDropdown = (props) => {
  const { setter, value, counterValue, baseLayers, layers, label, labelId } =
    props;

  const handleChange = (setter, value) => {
    setter(value);
  };

  return (
    <Box sx={{ minWidth: 120 }}>
      <FormControl fullWidth>
        <InputLabel id={labelId}>{label}</InputLabel>
        <Select
          labelId={labelId}
          label={label}
          value={value}
          onChange={(e) => handleChange(setter, e.target.value)}
        >
          <MenuItem value="">
            {t("plugins.layerComparer.noLayerSelected")}
          </MenuItem>
          {baseLayers.length > 0 && layers.length > 0 && (
            <ListSubheader>{t("common.backgroundLayers")}</ListSubheader>
          )}
          {baseLayers.map((l, i) => {
            return (
              <MenuItem key={i} value={l.id} disabled={l.id === counterValue}>
                {l.label}
              </MenuItem>
            );
          })}
          {baseLayers.length > 0 && layers.length > 0 && (
            <ListSubheader>{t("common.layers")}</ListSubheader>
          )}
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
