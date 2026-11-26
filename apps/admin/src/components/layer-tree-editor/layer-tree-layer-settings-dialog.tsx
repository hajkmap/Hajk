import { Button, Checkbox, FormControlLabel } from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import DialogWrapper from "../flexible-dialog";
import LayerInfoclickButton from "./layer-infoclick-button";
import {
  asInfoClick,
  storedInfoClick,
  sublayerOverridesOf,
  withDefinition,
  type LayerSettingsValues,
} from "./layer-tree-settings";

interface LayerTreeLayerSettingsDialogProps {
  layerId: string;
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
  layerId,
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
            onClick={() => {
              const info = asInfoClick(values.options);
              const rows = sublayerOverridesOf(values.options);
              onSave({
                // Not set here in an exclusive group; it keeps its value.
                visibleAtStart: exclusive
                  ? initial.visibleAtStart
                  : values.visibleAtStart,
                options:
                  rows.length > 0
                    ? storedInfoClick(info, rows)
                    : typeof info.definition === "string"
                      ? storedInfoClick(withDefinition(info, info.definition))
                      : storedInfoClick(info),
              });
            }}
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
      <LayerInfoclickButton
        layerId={layerId}
        value={asInfoClick(values.options).definition ?? ""}
        onChange={(definition) =>
          setValues((current) => ({
            ...current,
            options: storedInfoClick(
              withDefinition(asInfoClick(current.options), definition),
            ),
          }))
        }
        sublayerOverrides={sublayerOverridesOf(values.options)}
        onSublayerOverridesChange={(rows) =>
          setValues((current) => ({
            ...current,
            options: storedInfoClick(asInfoClick(current.options), rows),
          }))
        }
      />
    </DialogWrapper>
  );
}
