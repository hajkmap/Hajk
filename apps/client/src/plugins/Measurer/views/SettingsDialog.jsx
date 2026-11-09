import { useState } from "react";
import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Select,
  Stack,
  FormControl,
  InputLabel,
} from "@mui/material";

import BaseDialog from "components/Dialog/BaseDialog";
import HajkToolTip from "components/HajkToolTip";

import { MEASUREMENT_PRECISIONS } from "../constants";
import i18n from "src/i18n";

// Getters, so the strings are read when rendering (after i18n is initiated).
const UI_STRINGS = {
  get dialogTitle() {
    return i18n.t("measurer.settings.title");
  },
  get close() {
    return i18n.t("common.close");
  },
  get pointPrecisionLabel() {
    return i18n.t("measurer.settings.pointPrecision");
  },
  get pointPrecisionHelp() {
    return i18n.t("measurer.settings.pointPrecisionHelp");
  },
  get precisionLabel() {
    return i18n.t("measurer.settings.precision");
  },
  get precisionHelp() {
    return i18n.t("measurer.settings.precisionHelp");
  },
};

function PrecisionSelect({ id, label, helpText, value, onValueChange }) {
  const [showTooltip, setShowTooltip] = useState(true);
  return (
    <HajkToolTip title={showTooltip ? helpText : ""}>
      <FormControl size="small" fullWidth>
        <InputLabel id={`${id}-label`}>{label}</InputLabel>
        <Select
          id={id}
          labelId={`${id}-label`}
          label={label}
          value={value}
          onChange={(e) => onValueChange(parseInt(e.target.value))}
          onFocus={() => setShowTooltip(false)}
          onBlur={() => setShowTooltip(true)}
        >
          {MEASUREMENT_PRECISIONS.map((precision, index) => (
            <MenuItem value={precision.value} key={index}>
              {precision.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </HajkToolTip>
  );
}

function SettingsDialog(props) {
  const { open, onClose, measurementSettings, onChange } = props;

  return (
    <BaseDialog
      fullWidth
      maxWidth="xs"
      onClose={onClose}
      onMouseDown={(event) => {
        event.stopPropagation();
      }}
      open={open}
    >
      <DialogTitle>{UI_STRINGS.dialogTitle}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <PrecisionSelect
            id="measurer-select-precision"
            label={UI_STRINGS.precisionLabel}
            helpText={UI_STRINGS.precisionHelp}
            value={measurementSettings.precision ?? 0}
            onValueChange={(precision) => onChange({ precision })}
          />
          <PrecisionSelect
            id="measurer-select-point-precision"
            label={UI_STRINGS.pointPrecisionLabel}
            helpText={UI_STRINGS.pointPrecisionHelp}
            value={measurementSettings.pointPrecision ?? 0}
            onValueChange={(pointPrecision) => onChange({ pointPrecision })}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{UI_STRINGS.close}</Button>
      </DialogActions>
    </BaseDialog>
  );
}

export default SettingsDialog;
