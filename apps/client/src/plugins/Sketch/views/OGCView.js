import React from "react";
import { Grid, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import Information from "../components/Information";
import { OGC_SOURCES } from "../constants";

const OGCView = ({
    id,
    model,
    ogcSource,
    handleOgcSourceChange,
    handleFocus,
    focusKey = "ogc",
    labelText = "Välj redigeringstjänst att spara till",
}) => {

    const activity = model?.getActivityFromId?.(id);

    const onFocus = () => handleFocus && handleFocus(focusKey, false);
    const onBlur = () => handleFocus && handleFocus(focusKey, true);

    return (
        <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={12}>
                {activity?.information && <Information text={activity.information} />}
            </Grid>

            <Grid size={12}>
                <FormControl size="small" variant="outlined" fullWidth>
                    <InputLabel id="ogc-source-label">{labelText}</InputLabel>
                    <Select
                        id="sketch-select-ogc-source"
                        labelId="ogc-source-label"
                        value={ogcSource}
                        label={labelText}
                        onChange={(e) => handleOgcSourceChange(e.target.value)}
                        onFocus={onFocus}
                        onBlur={onBlur}
                        MenuProps={{ PaperProps: { sx: { maxHeight: 320 } } }}
                    >
                        {OGC_SOURCES.map((source, index) => (
                            <MenuItem value={source.label} key={index}>
                                {source.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Grid>
        </Grid>
    );
};

export default OGCView;
