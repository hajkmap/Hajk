import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import LayerInfoclickButton from "../layer-infoclick-button";
import { DEFAULT_LAYER_DISPLAY_SETTINGS, type LayerFormValues } from "./types";

interface LayerFormDialogProps {
  open: boolean;
  layerId: string;
  layerName: string;
  initialValues?: LayerFormValues;
  /** Exclusive parent groups manage visibility via radio selection in Kartlager. */
  disableVisibleAtStart?: boolean;
  onClose: () => void;
  onSubmit: (values: LayerFormValues) => void;
}

interface LayerFormDialogBodyProps {
  layerId: string;
  layerName: string;
  initialValues?: LayerFormValues;
  disableVisibleAtStart?: boolean;
  onClose: () => void;
  onSubmit: (values: LayerFormValues) => void;
}

function LayerFormDialogBody({
  layerId,
  layerName,
  initialValues,
  disableVisibleAtStart = false,
  onClose,
  onSubmit,
}: LayerFormDialogBodyProps) {
  const { t } = useTranslation();
  const [values, setValues] = useState<LayerFormValues>(
    initialValues ?? DEFAULT_LAYER_DISPLAY_SETTINGS,
  );

  const handleSubmit = () => {
    onSubmit({
      layerVisibleAtStart: disableVisibleAtStart
        ? (initialValues?.layerVisibleAtStart ?? false)
        : values.layerVisibleAtStart,
      layerInfoBox: values.layerInfoBox.trim(),
    });
  };

  return (
    <>
      <DialogTitle>{t("layerTree.background.editLayer")}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {layerName}
        </Typography>

        <FormControlLabel
          control={
            <Checkbox
              checked={
                disableVisibleAtStart
                  ? (initialValues?.layerVisibleAtStart ?? false)
                  : values.layerVisibleAtStart
              }
              disabled={disableVisibleAtStart}
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

        <LayerInfoclickButton
          layerId={layerId}
          value={values.layerInfoBox}
          onChange={(layerInfoBox) => {
            setValues((current) => ({ ...current, layerInfoBox }));
          }}
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
  layerId,
  layerName,
  initialValues,
  disableVisibleAtStart = false,
  onClose,
  onSubmit,
}: LayerFormDialogProps) {
  const formKey = initialValues
    ? `${layerName}-${JSON.stringify(initialValues)}-${disableVisibleAtStart}`
    : layerName;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      {open ? (
        <LayerFormDialogBody
          key={formKey}
          layerId={layerId}
          layerName={layerName}
          initialValues={initialValues}
          disableVisibleAtStart={disableVisibleAtStart}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      ) : null}
    </Dialog>
  );
}
