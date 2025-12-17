import { Grid2 as Grid } from "@mui/material";
import {
  TextField,
  FormControl,
  Switch,
  InputLabel,
  FormControlLabel,
  Select,
  MenuItem,
} from "@mui/material";

import { Controller, FieldValues, useForm } from "react-hook-form";
import FormAccordion from "../../../components/form-components/form-accordion";
import FormPanel from "../../../components/form-components/form-panel";
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
      <FormPanel title={t("common.information")}>
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
      </FormPanel>
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
