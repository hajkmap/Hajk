import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  Radio,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import { useTranslation } from "react-i18next";
import FeatureInfoDesigner from "./feature-info-designer";
import type { SublayerInfo, SublayersInfo } from "./infoclick-target";
import { hasBlockingIssues, validateTemplate } from "./template-validation";

interface SublayerInfoClickSettingsProps {
  value: SublayersInfo;
  onChange: (value: SublayersInfo) => void;
  /** The layer's selected layers in the service. */
  sublayers: string[];
  serviceUrl: string;
  layerName: string;
  /** The layer-wide template, which the client doesn't use for WMS layers. */
  unusedLayerTemplate: string;
  onOpenSublayerSettings: (sublayer: string) => void;
}

const EMPTY: SublayerInfo = { definition: "", queryable: false };

export default function SublayerInfoClickSettings({
  value,
  onChange,
  sublayers,
  serviceUrl,
  layerName,
  unusedLayerTemplate,
  onOpenSublayerSettings,
}: SublayerInfoClickSettingsProps) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(sublayers[0] ?? "");
  const active = sublayers.includes(selected) ? selected : (sublayers[0] ?? "");

  const infoOf = (name: string): SublayerInfo => value[name] ?? EMPTY;
  const update = (name: string, patch: Partial<SublayerInfo>) =>
    onChange({ ...value, [name]: { ...infoOf(name), ...patch } });

  const withoutTemplate = sublayers.filter((name) => !infoOf(name).definition.trim());
  const copyLayerTemplate = () =>
    onChange({
      ...value,
      ...Object.fromEntries(
        withoutTemplate.map((name) => [
          name,
          { ...infoOf(name), definition: unusedLayerTemplate },
        ]),
      ),
    });

  if (sublayers.length === 0) {
    return <Alert severity="info">{t("layers.featureInfo.noAttributes")}</Alert>;
  }

  return (
    <Box data-form-wide="" sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="body2" color="text.secondary">
        {t("layers.featureInfo.sublayersIntro")}
      </Typography>
      {unusedLayerTemplate.trim() && withoutTemplate.length > 0 && (
        <Alert
          severity="warning"
          action={
            <Button size="small" onClick={copyLayerTemplate}>
              {t("layers.featureInfo.copyLayerTemplate")}
            </Button>
          }
        >
          {t("layers.featureInfo.layerTemplateUnused", { count: withoutTemplate.length })}
        </Alert>
      )}
      <Table size="small" aria-label={t("layers.featureInfo.sublayers")}>
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox" />
            <TableCell>{t("layers.featureInfo.sublayer")}</TableCell>
            <TableCell>{t("common.infoclick")}</TableCell>
            <TableCell>{t("layers.infobox")}</TableCell>
            <TableCell padding="checkbox" />
          </TableRow>
        </TableHead>
        <TableBody>
          {sublayers.map((name) => {
            const info = infoOf(name);
            const hasTemplate = Boolean(info.definition.trim());
            const broken =
              hasTemplate && hasBlockingIssues(validateTemplate(info.definition));
            return (
              <TableRow
                key={name}
                hover
                selected={name === active}
                onClick={() => setSelected(name)}
                sx={{ cursor: "pointer" }}
              >
                <TableCell padding="checkbox">
                  <Radio
                    size="small"
                    checked={name === active}
                    onChange={() => setSelected(name)}
                    slotProps={{ input: { "aria-label": name } }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                    {name}
                  </Typography>
                  {info.caption && (
                    <Typography variant="caption" color="text.secondary">
                      {info.caption}
                    </Typography>
                  )}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Switch
                    size="small"
                    checked={info.queryable}
                    onChange={(e) => update(name, { queryable: e.target.checked })}
                    slotProps={{
                      input: {
                        "aria-label": t("layers.featureInfo.queryableFor", { name }),
                      },
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    variant="outlined"
                    color={broken ? "error" : hasTemplate ? "primary" : "default"}
                    label={t(
                      broken
                        ? "layers.featureInfo.templateHasErrors"
                        : hasTemplate
                          ? "layers.featureInfo.ownTemplate"
                          : "layers.featureInfo.defaultTable",
                    )}
                  />
                </TableCell>
                <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                  <Tooltip title={t("layers.featureInfo.sublayerSettings")}>
                    <IconButton
                      size="small"
                      aria-label={t("layers.featureInfo.sublayerSettings")}
                      onClick={() => onOpenSublayerSettings(name)}
                    >
                      <SettingsIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {!infoOf(active).queryable && (
        <Alert severity="info">
          {t("layers.featureInfo.sublayerNotQueryable", { name: active })}
        </Alert>
      )}
      <FeatureInfoDesigner
        key={active}
        inputId="options.layersInfo.definition"
        value={infoOf(active).definition}
        onChange={(definition) => update(active, { definition })}
        serviceUrl={serviceUrl}
        typeNames={[active]}
        caption={infoOf(active).caption ?? layerName}
        displayFields={
          infoOf(active).searchDisplayName as string | undefined
        }
      />
    </Box>
  );
}
