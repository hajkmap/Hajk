import { Grid2 as Grid } from "@mui/material";
import {
  TextField,
  FormControlLabel,
  FormControl,
  Switch,
  Checkbox,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";

import { Controller, FieldValues, useForm } from "react-hook-form";
import FormPanel from "../../../components/form-components/form-panel";
import FormAccordion from "../../../components/form-components/form-accordion";
import { useTranslation } from "react-i18next";

export default function SketchRenderer({
  tool,
}: {
  tool: { [key: string]: any };
}) {
  const { t } = useTranslation();

  const { control } = useForm<FieldValues>({
    defaultValues: {
      type: tool?.type ?? "sketch",
      ...(tool?.options
        ? Object.fromEntries(
            Object.entries(tool.options).map(([k, v]) => [`options.${k}`, v])
          )
        : {}),
    },
  });

  return (
    <>
      {/* ─────────────────────────────────────────────
          BASIC SETTINGS
      ───────────────────────────────────────────── */}
      <FormPanel title={t("common.information")}>
        <Grid container>
          {/* Aktiverad */}
          <Grid size={{ xs: 12, md: 10 }}>
            <Controller
              name="options.active"
              control={control}
              defaultValue={Boolean(tool?.options?.active)}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Switch
                      checked={!!field.value}
                      onChange={(_, checked) => field.onChange(checked)}
                    />
                  }
                  label={t("tools.active")}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 10 }}>
            <Controller
              name="options.visibleAtStart"
              control={control}
              defaultValue={Boolean(tool?.options?.visibleAtStart)}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!field.value}
                      onChange={(_, checked) => field.onChange(checked)}
                    />
                  }
                  label={t("tools.visibleAtStart")}
                />
              )}
            />
          </Grid>

          {/* Instruktion */}
          <Grid size={{ xs: 12, md: 10 }}>
            <Controller
              name="options.instruction"
              control={control}
              defaultValue={tool?.options?.instruction ?? ""}
              render={({ field }) => (
                <TextField
                  label={t("tools.instructionText")}
                  fullWidth
                  multiline
                  rows={4}
                  value={field.value ? atob(field.value) : ""}
                  onChange={(e) => field.onChange(btoa(e.target.value))}
                />
              )}
            />
          </Grid>

          {/* Tillträde */}
          <Grid size={{ xs: 12, md: 10 }}>
            <Controller
              name="options.access"
              control={control}
              defaultValue={tool?.options?.access ?? ""}
              render={({ field }) => (
                <TextField label={t("tools.access")} fullWidth {...field} />
              )}
            />
          </Grid>
        </Grid>
      </FormPanel>

      {/* ─────────────────────────────────────────────
          WINDOW SETTINGS
      ───────────────────────────────────────────── */}
      <FormAccordion title={t("tools.windowSettings")} defaultExpanded>
        <Grid container>
          {/* Sorteringsordning */}
          <Grid size={{ xs: 12, md: 10 }}>
            <Controller
              name="options.index"
              control={control}
              defaultValue={tool?.options?.index ?? 300}
              render={({ field }) => (
                <TextField
                  type="number"
                  label={t("tools.sortIndex")}
                  fullWidth
                  {...field}
                />
              )}
            />
          </Grid>

          {/* Verktygsplacering */}
          <Grid size={{ xs: 12, md: 10 }}>
            <FormControl fullWidth>
              <InputLabel>{t("tools.toolPlacement")}</InputLabel>
              <Controller
                name="options.placement"
                control={control}
                defaultValue={tool?.options?.placement ?? "drawer"}
                render={({ field }) => (
                  <Select {...field} label={t("tools.toolPlacement")}>
                    <MenuItem value="drawer">{t("tools.drawer")}</MenuItem>
                    <MenuItem value="sidepanel">
                      {t("tools.sidepanel")}
                    </MenuItem>
                    <MenuItem value="window">{t("tools.window")}</MenuItem>
                  </Select>
                )}
              />
            </FormControl>
          </Grid>

          {/* Fönsterplacering */}
          <Grid size={{ xs: 12, md: 10 }}>
            <FormControl fullWidth>
              <InputLabel>{t("tools.windowPlacement")}</InputLabel>
              <Controller
                name="options.position"
                control={control}
                defaultValue={tool?.options?.position ?? "right"}
                render={({ field }) => (
                  <Select {...field} label={t("tools.windowPlacement")}>
                    <MenuItem value="left">{t("tools.left")}</MenuItem>
                    <MenuItem value="right">{t("tools.right")}</MenuItem>
                  </Select>
                )}
              />
            </FormControl>
          </Grid>

          {/* Fönsterbredd */}
          <Grid size={{ xs: 12, md: 10 }}>
            <Controller
              name="options.width"
              control={control}
              defaultValue={tool?.options?.width ?? ""}
              render={({ field }) => (
                <TextField
                  label={t("tools.windowWidth")}
                  fullWidth
                  {...field}
                />
              )}
            />
          </Grid>

          {/* Fönsterhöjd */}
          <Grid size={{ xs: 12, md: 10 }}>
            <Controller
              name="options.height"
              control={control}
              defaultValue={tool?.options?.height ?? ""}
              render={({ field }) => (
                <TextField
                  label={t("tools.windowHeight")}
                  fullWidth
                  {...field}
                />
              )}
            />
          </Grid>
        </Grid>
      </FormAccordion>
    </>
  );
}
