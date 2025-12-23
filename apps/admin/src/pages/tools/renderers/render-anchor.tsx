import { useEffect } from "react";
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
import { Controller, useForm, FieldValues, Control } from "react-hook-form";
import FormPanel from "../../../components/form-components/form-panel";
import FormAccordion from "../../../components/form-components/form-accordion";
import { useTranslation } from "react-i18next";
import { Tool } from "../../../api/tools";

interface AnchorToolRendererProps {
  tool: Tool;
  control?: Control<FieldValues>;
}

export default function AnchorToolRenderer({
  tool,
  control: parentControl,
}: AnchorToolRendererProps) {
  const { t } = useTranslation();

  const { control: localControl, reset } = useForm<FieldValues>({
    mode: "onChange",
    reValidateMode: "onChange",
  });

  // Use parent control if provided, otherwise use local
  const control = parentControl ?? localControl;

  // Reset form with tool data when it loads (only for local control)
  useEffect(() => {
    if (tool && !parentControl) {
      reset({
        type: tool.type ?? "",
        active: tool.options?.active ?? false,
        options: {
          target: tool.options?.target ?? "",
          visibleAtStart: tool.options?.visibleAtStart ?? false,
          allowCreatingCleanUrls: tool.options?.allowCreatingCleanUrls ?? false,
          instruction: tool.options?.instruction ?? "",
          visibleForGroups: tool.options?.visibleForGroups ?? [],
        },
      });
    }
  }, [tool, reset, parentControl]);

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
                    value={field.value || ""}
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
