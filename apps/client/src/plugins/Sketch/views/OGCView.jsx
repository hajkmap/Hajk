import React from "react";
import {
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from "@mui/material";
import Information from "../components/Information";
import TableChartIcon from "@mui/icons-material/TableChart";
import { NO_SERVICE_LABEL } from "../../../buses/editBus";
import i18n from "src/i18n";

const OGCView = ({
  id,
  model,
  ogcSource,
  handleOgcSourceChange,
  handleFocus,
  focusKey = "ogc",
  labelText = i18n.t("sketch.ogc.chooseLayer"),
  uiDisabled,
  serviceList = [],
  globalObserver,
}) => {
  const activity = model?.getActivityFromId?.(id);

  const onFocus = React.useCallback(
    () => handleFocus && handleFocus(focusKey, false),
    [handleFocus, focusKey]
  );
  const onBlur = React.useCallback(
    () => handleFocus && handleFocus(focusKey, true),
    [handleFocus, focusKey]
  );

  const options = React.useMemo(() => {
    return [
      { id: "NONE_ID", label: NO_SERVICE_LABEL },
      ...serviceList.map((s) => ({
        id: s.id,
        label: s.title || s.id,
      })),
    ];
  }, [serviceList]);

  const handleOpenAttributeEditor = React.useCallback(() => {
    if (globalObserver) {
      globalObserver.publish("attributeeditor.showWindow", {
        hideOtherPluginWindows: false, // Keep Sketch window open
        runCallback: true,
      });
    }
  }, [globalObserver]);

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
                {option.id === "NONE_ID"
                  ? i18n.t("editing.noService")
                  : option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid size={12}>
        <Button
          variant="contained"
          color="primary"
          fullWidth
          size="small"
          startIcon={<TableChartIcon />}
          onClick={handleOpenAttributeEditor}
          disabled={uiDisabled}
        >
          {i18n.t("sketch.ogc.openAttributeEditor")}
        </Button>
      </Grid>
    </Grid>
  );
};

export default OGCView;
