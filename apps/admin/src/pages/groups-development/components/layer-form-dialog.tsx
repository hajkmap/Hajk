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
import { useState } from "react";
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

interface LayerFormDialogBodyProps {
  layerName: string;
  initialValues?: LayerFormValues;
  onClose: () => void;
  onSubmit: (values: LayerFormValues) => void;
}

function LayerFormDialogBody({
  layerName,
  initialValues,
  onClose,
  onSubmit,
}: LayerFormDialogBodyProps) {
  const { t } = useTranslation();
  const [values, setValues] = useState<LayerFormValues>(
    initialValues ?? DEFAULT_LAYER_DISPLAY_SETTINGS,
  );

  const handleSubmit = () => {
    onSubmit({
      layerVisibleAtStart: values.layerVisibleAtStart,
      layerInfoBox: values.layerInfoBox.trim(),
    });
  };

  return (
    <>
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
    </>
  );
}

export default function LayerFormDialog({
  open,
  layerName,
  initialValues,
  onClose,
  onSubmit,
}: LayerFormDialogProps) {
  const formKey = initialValues
    ? `${layerName}-${JSON.stringify(initialValues)}`
    : layerName;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      {open ? (
        <LayerFormDialogBody
          key={formKey}
          layerName={layerName}
          initialValues={initialValues}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      ) : null}
    </Dialog>
  );
}
