import React from "react";
import { Grid, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import Information from "../components/Information";

const OGCView = ({
  id,
  model,
  ogcSource,
  handleOgcSourceChange,
  handleFocus,
  focusKey = "ogc",
  labelText = "Välj redigerbart lager att spara till",
  uiDisabled,
  serviceList = [],
}) => {
  const activity = model?.getActivityFromId?.(id);

  const onFocus = () => handleFocus && handleFocus(focusKey, false);
  const onBlur = () => handleFocus && handleFocus(focusKey, true);

  const options = React.useMemo(() => {
    return [
      { id: "NONE_ID", label: "Ingen" },
      ...serviceList.map((s) => ({
        id: s.id,
        label: s.title || s.id,
      })),
    ];
  }, [serviceList]);

  return (
    <Grid container spacing={2} sx={{ mt: 1 }}>
      <Grid size={12}>
        {activity?.information && <Information text={activity.information} />}
      </Grid>
      <Grid size={12}>
        <FormControl size="small" variant="outlined" fullWidth>
          <InputLabel id="ogc-source-label">{labelText}</InputLabel>
          <Select
            disabled={uiDisabled}
            aria-busy={uiDisabled ? "true" : "false"}
            id="sketch-select-ogc-source"
            labelId="ogc-source-label"
            value={ogcSource}
            label={labelText}
            onChange={(e) => handleOgcSourceChange(e.target.value)}
            onFocus={onFocus}
            onBlur={onBlur}
            MenuProps={{ PaperProps: { sx: { maxHeight: 320 } } }}
          >
            {options.map((option) => (
              <MenuItem value={option.label} key={option.id}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  );
};

export default OGCView;
