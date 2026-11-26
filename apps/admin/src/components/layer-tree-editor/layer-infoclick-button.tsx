import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";

import { useLayerById, useServiceByLayerId, type Layer } from "../../api/layers";
import { SERVICE_TYPE } from "../../api/services";
import FeatureInfoDesigner from "../../pages/layers/feature-info/feature-info-designer";
import {
  type SublayerOverride,
} from "./layer-tree-settings";

const textOf = (value: unknown) => (typeof value === "string" ? value : "");

/** The layer's own template. A sublayer id reads that row in InfoClickSettings.options. */
function sourceDefinition(layer: Layer | undefined, sublayerId?: string): string {
  const settings = layer?.infoClickSettings;
  if (sublayerId && Array.isArray(settings?.options)) {
    for (const row of settings.options) {
      if (!row || typeof row !== "object") continue;
      const record = row as Record<string, unknown>;
      if (record.id !== sublayerId) continue;
      return textOf(record.definition) || textOf(record.infobox);
    }
  }
  return textOf(settings?.definition);
}

/** True unless the layer (or that WMS sublayer row) has active set to false. */
function sourceIsActive(layer: Layer | undefined, sublayerId?: string): boolean {
  const settings = layer?.infoClickSettings;
  if (sublayerId && Array.isArray(settings?.options)) {
    for (const row of settings.options) {
      if (!row || typeof row !== "object") continue;
      const record = row as Record<string, unknown>;
      if (record.id !== sublayerId) continue;
      if (typeof record.active === "boolean") return record.active;
      if (typeof record.queryable === "boolean") return record.queryable;
      return true;
    }
    return true;
  }
  return settings?.active !== false;
}

function InfoclickOffNotice({
  names,
  flush = false,
}: {
  names: string[];
  flush?: boolean;
}) {
  const { t } = useTranslation();
  if (names.length === 0) return null;
  return (
    <Alert severity="info" sx={flush ? undefined : { mt: 1 }}>
      {names.length > 1
        ? t("layerTree.settings.infoclickOffMany", { names: names.join(", ") })
        : t("layers.featureInfo.sublayerNotQueryable", { name: names[0] })}
    </Alert>
  );
}

interface LayerInfoclickButtonProps {
  layerId: string;
  value: string;
  onChange: (value: string) => void;
  sublayerOverrides?: SublayerOverride[];
  onSublayerOverridesChange?: (rows: SublayerOverride[]) => void;
}

/**
 * Opens the infoclick editor for one placement. A vector or search layer has
 * one template. A WMS layer has one template per sublayer, stored with that
 * sublayer's id.
 */
export default function LayerInfoclickButton({
  layerId,
  value,
  onChange,
  sublayerOverrides,
  onSublayerOverridesChange,
}: LayerInfoclickButtonProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const layerQuery = useLayerById(layerId);
  const serviceQuery = useServiceByLayerId(layerId, Boolean(layerId));
  const layer = layerQuery.data;
  const sublayerIds = layer?.selectedLayers ?? [];
  const perSublayer =
    serviceQuery.data?.type === SERVICE_TYPE.WMS &&
    sublayerIds.length > 0 &&
    onSublayerOverridesChange != null;
  const activeId = sublayerIds.includes(selectedId)
    ? selectedId
    : (sublayerIds[0] ?? "");
  const storedRows = sublayerOverrides ?? [];

  const definitionFor = (id: string) => {
    const stored = storedRows.find((row) => row.id === id);
    if (stored) return stored.definition;
    if (storedRows.length === 0 && value.trim()) return value;
    return "";
  };

  const shownValue = value;

  const wms =
    serviceQuery.data?.type === SERVICE_TYPE.WMS && sublayerIds.length > 0;
  const offNames = wms
    ? sublayerIds.filter((id) => !sourceIsActive(layer, id))
    : sourceIsActive(layer)
      ? []
      : [layer?.name ?? t("layers.infobox")];
  const editingName = perSublayer ? activeId : (layer?.name ?? "");
  const editingOff = perSublayer
    ? !sourceIsActive(layer, activeId)
    : !sourceIsActive(layer);

  const hasOverride = perSublayer
    ? storedRows.some((row) => row.definition.trim()) ||
      (storedRows.length === 0 && value.trim().length > 0)
    : value.trim().length > 0;
  const sourceForActive = sourceDefinition(
    layer,
    perSublayer ? activeId : undefined,
  );

  const changeSublayer = (id: string, definition: string) => {
    onSublayerOverridesChange?.(
      sublayerIds.flatMap((sublayerId) => {
        if (sublayerId === id) return [{ id: sublayerId, definition }];
        const stored = storedRows.find((row) => row.id === sublayerId);
        if (stored) return [stored];
        if (storedRows.length === 0 && value.trim()) {
          return [{ id: sublayerId, definition: value }];
        }
        return [];
      }),
    );
  };

  const loadLayerInfoclick = () => {
    if (perSublayer) changeSublayer(activeId, sourceForActive);
    else onChange(sourceForActive);
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {t("layerTree.settings.infoboxHelp")}
      </Typography>
      <Button variant="outlined" onClick={() => setOpen(true)}>
        {t("layerTree.settings.editInfoclick")}
      </Button>
      {hasOverride && (
        <Alert severity="info" sx={{ mt: 1 }}>
          {t("layerTree.settings.infoclickOverride")}
        </Alert>
      )}
      <InfoclickOffNotice names={offNames} />
      <Dialog
        fullScreen
        open={open}
        onClose={() => setOpen(false)}
        transitionDuration={0}
        slotProps={{
          paper: { sx: { display: "flex", flexDirection: "column", height: "100%" } },
        }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 2, py: 1.5, flexShrink: 0 }}>
          <Box sx={{ flex: 1, minWidth: 0 }} className="truncate-overflow">
            {layer?.name ?? t("layers.infobox")}
          </Box>
          <Button variant="contained" onClick={() => setOpen(false)}>
            {t("layers.featureInfo.done")}
          </Button>
        </DialogTitle>
        <DialogContent
          dividers
          sx={{
            display: "flex",
            flexDirection: "column",
            flex: "1 1 auto",
            minHeight: 0,
            gap: 2,
            overflow: { xs: "auto", lg: "hidden" },
          }}
        >
          {open && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              {perSublayer && sublayerIds.length > 1 && (
                <TextField
                  select
                  size="small"
                  label={t("layers.featureInfo.sublayer")}
                  value={activeId}
                  onChange={(event) => setSelectedId(event.target.value)}
                  sx={{ maxWidth: 360 }}
                >
                  {sublayerIds.map((id) => (
                    <MenuItem key={id} value={id}>
                      {id}
                    </MenuItem>
                  ))}
                </TextField>
              )}
              <Button
                variant="outlined"
                size="small"
                disabled={!sourceForActive.trim()}
                onClick={loadLayerInfoclick}
              >
                {t("layerTree.settings.loadLayerInfoclick")}
              </Button>
            </Box>
          )}
          {open && perSublayer && (
            <>
              {editingOff && (
                <InfoclickOffNotice flush names={[editingName]} />
              )}
              <FeatureInfoDesigner
                key={activeId}
                fill
                expandDisabled
                value={definitionFor(activeId)}
                onChange={(definition) => changeSublayer(activeId, definition)}
                serviceUrl={serviceQuery.data?.url ?? ""}
                typeNames={[activeId]}
                caption={activeId}
                emptyShowsAttributes={false}
              />
            </>
          )}
          {open && !perSublayer && (
            <>
            {editingOff && (
              <InfoclickOffNotice
                flush
                names={[editingName || t("layers.infobox")]}
              />
            )}
            <FeatureInfoDesigner
              fill
              expandDisabled
              value={shownValue}
              onChange={onChange}
              serviceUrl={serviceQuery.data?.url ?? ""}
              typeNames={sublayerIds}
              caption={layer?.name ?? ""}
              displayFields={layer?.infoClickSettings?.displayFields ?? undefined}
              emptyShowsAttributes={false}
            />
            </>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
