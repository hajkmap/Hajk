import {
  Box,
  FormControl,
  InputLabel,
  ListSubheader,
  Select,
  MenuItem,
} from "@mui/material";
import i18n from "src/i18n";

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
          <MenuItem value="">
            {i18n.t("layerComparer.noLayerSelected")}
          </MenuItem>

          {chosenBaseLayers.length > 0 && [
            <ListSubheader key="chosen-base-header">
              {i18n.t("layerComparer.backgroundLayers")}
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
            <ListSubheader key="chosen-layer-header">
              {i18n.t("layerComparer.layers")}
            </ListSubheader>,
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
            <ListSubheader key="base-header">
              {i18n.t("layerComparer.backgroundLayers")}
            </ListSubheader>,
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
            <ListSubheader key="layer-header">
              {i18n.t("layerComparer.layers")}
            </ListSubheader>,
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
