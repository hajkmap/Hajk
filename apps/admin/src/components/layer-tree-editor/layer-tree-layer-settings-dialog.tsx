import { Button, Checkbox, FormControlLabel, TextField } from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import DialogWrapper from "../flexible-dialog";
import type { LayerSettingsValues } from "./layer-tree-settings";

interface LayerTreeLayerSettingsDialogProps {
  layerName: string;
  groupName: string;
  values: LayerSettingsValues;
  /** In an exclusive group the user picks one layer at a time. */
  exclusive: boolean;
  onClose: () => void;
  onSave: (values: LayerSettingsValues) => void;
}

/**
 * A layer's settings in one of the map's groups, as Lagerordning's layer
 * form. Open it with a `key` per layer, so it starts from that layer's values.
 */
export default function LayerTreeLayerSettingsDialog({
  layerName,
  groupName,
  values: initial,
  exclusive,
  onClose,
  onSave,
}: LayerTreeLayerSettingsDialogProps) {
  const { t } = useTranslation();
  const [values, setValues] = useState<LayerSettingsValues>(initial);

  return (
    <DialogWrapper
      open
      title={t("layerTree.settings.layerTitle", {
        name: layerName,
        group: groupName,
      })}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      actions={
        <>
          <Button onClick={onClose}>{t("common.cancel")}</Button>
          <Button
            variant="contained"
            onClick={() =>
              onSave({
                // Not set here in an exclusive group; it keeps its value.
                visibleAtStart: exclusive
                  ? initial.visibleAtStart
                  : values.visibleAtStart,
                infobox: values.infobox.trim(),
              })
            }
          >
            {t("common.dialog.okBtn")}
          </Button>
        </>
      }
    >
      <FormControlLabel
        control={
          <Checkbox
            checked={values.visibleAtStart}
            disabled={exclusive}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                visibleAtStart: event.target.checked,
              }))
            }
          />
        }
        label={t(
          exclusive
            ? "layerTree.settings.visibleAtStartExclusive"
            : "layerTree.settings.visibleAtStart",
        )}
      />
      <TextField
        fullWidth
        multiline
        minRows={4}
        label={t("layerTree.settings.infobox")}
        value={values.infobox}
        onChange={(event) =>
          setValues((current) => ({ ...current, infobox: event.target.value }))
        }
        sx={{ mt: 2 }}
      />
    </DialogWrapper>
  );
}
