import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  DEFAULT_LAYER_DISPLAY_SETTINGS,
  type LayerFormValues,
} from "../types";

interface LayerFormDialogProps {
  open: boolean;
  layerName: string;
  initialValues?: LayerFormValues;
  onClose: () => void;
  onSubmit: (values: LayerFormValues) => void;
}

export default function LayerFormDialog({
  open,
  layerName,
  initialValues,
  onClose,
  onSubmit,
}: LayerFormDialogProps) {
  const { t } = useTranslation();
  const [values, setValues] = useState<LayerFormValues>(
    initialValues ?? DEFAULT_LAYER_DISPLAY_SETTINGS,
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    setValues(initialValues ?? DEFAULT_LAYER_DISPLAY_SETTINGS);
  }, [initialValues, open]);

  const handleSubmit = () => {
    onSubmit({
      layerVisibleAtStart: values.layerVisibleAtStart,
      layerInfoBox: values.layerInfoBox.trim(),
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t("groupsDevelopment.editLayer")}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {layerName}
        </Typography>

        <FormControlLabel
          control={
            <Checkbox
              checked={values.layerVisibleAtStart}
              onChange={(event) => {
                setValues((current) => ({
                  ...current,
                  layerVisibleAtStart: event.target.checked,
                }));
              }}
            />
          }
          label={t("map.layerVisibleAtStart")}
        />

        <TextField
          label={t("groupsDevelopment.layerInfoBox")}
          value={values.layerInfoBox}
          onChange={(event) => {
            setValues((current) => ({
              ...current,
              layerInfoBox: event.target.value,
            }));
          }}
          fullWidth
          multiline
          minRows={4}
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("common.cancel")}</Button>
        <Button onClick={handleSubmit} variant="contained">
          {t("common.dialog.okBtn")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
