import { Grid2 as Grid } from "@mui/material";
import {
  TextField,
  FormControlLabel,
  Checkbox,
  Switch,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import FormPanel from "../../../components/form-components/form-panel";
import FormAccordion from "../../../components/form-components/form-accordion";
import { useTranslation } from "react-i18next";

export default function AnchorToolRenderer({
  tool,
}: {
  tool: { [key: string]: any };
}) {
  const { t } = useTranslation();

  const { control } = useForm<FieldValues>({
    defaultValues: {
      type: tool?.type ?? "",
      ...(tool?.options
        ? Object.fromEntries(
            Object.entries(tool.options).map(([k, v]) => [
              `options.${k}`,
              String(v ?? ""),
            ])
          )
        : {}),
    },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  return (
    <>
      {/* BASIC INFO */}
      <FormPanel title={t("common.information")}>
        <Grid container>
          <Grid size={{ xs: 12, md: 10 }}>
            <Controller
              name="active"
              control={control}
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
              name="index"
              control={control}
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

          <Grid size={{ xs: 12, md: 10 }}>
            <Controller
              name="options.target"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel id={"target"}>{t("tools.placement")}</InputLabel>
                  <Select
                    {...field}
                    labelId={"target"}
                    label={t("tools.placement")}
                  >
                    <MenuItem value="toolbar">Drawer</MenuItem>
                    <MenuItem value="left">Widget left</MenuItem>
                    <MenuItem value="right">Widget right</MenuItem>
                    <MenuItem value="control">Control button</MenuItem>
                  </Select>
                </FormControl>
              )}
            />
          </Grid>
        </Grid>
      </FormPanel>

      {/* SETTINGS */}
      <FormAccordion title={t("tools.settings")} defaultExpanded>
        <Grid container>
          <Grid size={{ xs: 12, md: 10 }}>
            <Controller
              name="options.visibleAtStart"
              control={control}
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

          <Grid size={12}>
            <Controller
              name="options.allowCreatingCleanUrls"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!field.value}
                      onChange={(_, checked) => field.onChange(checked)}
                    />
                  }
                  label={t("tools.allowCreatingCleanUrls")}
                />
              )}
            />
          </Grid>

          <Grid size={12}>
            <Controller
              name="options.instruction"
              control={control}
              render={({ field }) => (
                <TextField
                  label={t("tools.instructionText")}
                  fullWidth
                  multiline
                  rows={3}
                  value={field.value ? atob(field.value) : ""}
                  onChange={(e) => field.onChange(btoa(e.target.value))}
                />
              )}
            />
          </Grid>

          <Grid size={12}>
            <Controller
              name="options.visibleForGroups"
              control={control}
              render={({ field }) => (
                <TextField
                  label={t("tools.visibleForGroups")}
                  fullWidth
                  value={(field.value || []).join(",")}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value ? e.target.value.split(",") : []
                    )
                  }
                />
              )}
            />
          </Grid>
        </Grid>
      </FormAccordion>
    </>
  );
}
