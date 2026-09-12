import { useState } from "react";
import {
  TextField,
  Checkbox,
  FormControlLabel,
  Button,
  IconButton,
  Stack,
  Box,
  Typography,
} from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";
import {
  Control,
  Controller,
  FieldValues,
  useFieldArray,
  useForm,
} from "react-hook-form";
import FormPanel from "../../../components/form-components/form-panel";
import FormFieldGrid, {
  FormFieldRow,
} from "../../../components/form-components/form-field-grid";
import { useTranslation } from "react-i18next";
import { Tool } from "../../../api/tools";

// Used as the isDirty baseline in settings.tsx. Matches CoordinatesModel.js's
// own fallbacks (client MapClickModel is not involved here).
export const coordinatesDefaults: Record<string, unknown> = {
  visibleAtStart: false,
  instruction: "",
  visibleForGroups: [],
  thousandSeparator: false,
  showFieldsOnStart: false,
  src: "marker.png",
  anchor: [0.5, 1],
  scale: 0.15,
  transformations: [],
};

interface CoordinatesRendererProps {
  tool: Tool;
  control?: Control<FieldValues>;
}

interface NewTransformation {
  code: string;
  title: string;
  xtitle: string;
  ytitle: string;
  precision: string;
  hint: string;
  default: boolean;
  inverseAxis: boolean;
}

const EMPTY_NEW: NewTransformation = {
  code: "",
  title: "",
  xtitle: "",
  ytitle: "",
  precision: "3",
  hint: "",
  default: false,
  inverseAxis: false,
};

export default function CoordinatesRenderer({
  tool,
  control: parentControl,
}: CoordinatesRendererProps) {
  const { t } = useTranslation();

  const { control: localControl } = useForm<FieldValues>({
    defaultValues: {
      type: tool?.type ?? "coordinates",
      options: { ...coordinatesDefaults, ...tool?.options },
    },
  });

  // Use the parent form's control when provided (keeps these fields in the
  // page's single save flow); otherwise fall back to a local, standalone form.
  const control = parentControl ?? localControl;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "options.transformations",
  });

  const [newT, setNewT] = useState<NewTransformation>(EMPTY_NEW);

  const addTransformation = () => {
    if (!newT.code.trim() || !newT.title.trim()) return;
    append({
      code: newT.code.trim(),
      title: newT.title.trim(),
      xtitle: newT.xtitle.trim(),
      ytitle: newT.ytitle.trim(),
      precision: Number(newT.precision) || 0,
      hint: newT.hint.trim(),
      default: newT.default,
      inverseAxis: newT.inverseAxis,
    });
    setNewT(EMPTY_NEW);
  };

  return (
    <>
      <FormPanel title={t("common.information")}>
        <FormFieldGrid>
          <FormFieldRow>
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
          </FormFieldRow>

          <FormFieldRow>
            <Controller
              name="options.showFieldsOnStart"
              control={control}
              defaultValue={Boolean(tool?.options?.showFieldsOnStart)}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!field.value}
                      onChange={(_, checked) => field.onChange(checked)}
                    />
                  }
                  label={t("tools.coordinates.showFieldsOnStart")}
                />
              )}
            />
          </FormFieldRow>

          <FormFieldRow>
            <Controller
              name="options.thousandSeparator"
              control={control}
              defaultValue={Boolean(tool?.options?.thousandSeparator)}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!field.value}
                      onChange={(_, checked) => field.onChange(checked)}
                    />
                  }
                  label={t("tools.coordinates.thousandSeparator")}
                />
              )}
            />
          </FormFieldRow>

          <FormFieldRow>
            <Controller
              name="options.instruction"
              control={control}
              defaultValue={tool?.options?.instruction ?? ""}
              render={({ field }) => (
                <TextField
                  label={t("tools.instruction")}
                  fullWidth
                  multiline
                  rows={4}
                  value={
                    typeof field.value === "string" && field.value
                      ? atob(field.value)
                      : ""
                  }
                  onChange={(e) => field.onChange(btoa(e.target.value))}
                />
              )}
            />
          </FormFieldRow>

          <FormFieldRow>
            <Controller
              name="options.visibleForGroups"
              control={control}
              defaultValue={
                Array.isArray(tool?.options?.visibleForGroups)
                  ? (tool.options.visibleForGroups as string[]).join(",")
                  : ""
              }
              render={({ field }) => (
                <TextField
                  label={t("tools.visibleForGroups")}
                  fullWidth
                  value={
                    Array.isArray(field.value)
                      ? (field.value as string[]).join(",")
                      : ((field.value as string) ?? "")
                  }
                  onChange={(e) =>
                    field.onChange(
                      e.target.value
                        ? e.target.value.split(",").map((s) => s.trim())
                        : [],
                    )
                  }
                />
              )}
            />
          </FormFieldRow>
        </FormFieldGrid>
      </FormPanel>

      <FormPanel title={t("tools.iconsAndMarkers")}>
        <FormFieldGrid>
          <FormFieldRow>
            <Controller
              name="options.src"
              control={control}
              defaultValue={tool?.options?.src ?? coordinatesDefaults.src}
              render={({ field }) => (
                <TextField label={t("tools.imageUrl")} fullWidth {...field} />
              )}
            />
          </FormFieldRow>

          <FormFieldRow>
            <Stack direction="row" spacing={2}>
              <Controller
                name="options.anchor.0"
                control={control}
                defaultValue={
                  Array.isArray(tool?.options?.anchor)
                    ? (tool.options.anchor as number[])[0]
                    : 0.5
                }
                render={({ field }) => (
                  <TextField
                    label={t("tools.iconAnchorX")}
                    type="number"
                    slotProps={{ htmlInput: { step: 0.1, min: 0, max: 100 } }}
                    sx={{ flex: 1 }}
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                )}
              />
              <Controller
                name="options.anchor.1"
                control={control}
                defaultValue={
                  Array.isArray(tool?.options?.anchor)
                    ? (tool.options.anchor as number[])[1]
                    : 1
                }
                render={({ field }) => (
                  <TextField
                    label={t("tools.iconAnchorY")}
                    type="number"
                    slotProps={{ htmlInput: { step: 0.1, min: 0, max: 100 } }}
                    sx={{ flex: 1 }}
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                )}
              />
              <Controller
                name="options.scale"
                control={control}
                defaultValue={tool?.options?.scale ?? coordinatesDefaults.scale}
                render={({ field }) => (
                  <TextField
                    label={t("tools.iconScale")}
                    type="number"
                    slotProps={{
                      htmlInput: { step: 0.01, min: 0.01, max: 10 },
                    }}
                    sx={{ flex: 1 }}
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                )}
              />
            </Stack>
          </FormFieldRow>
        </FormFieldGrid>
      </FormPanel>

      <FormPanel title={t("tools.coordinates.transformationsList")}>
        <FormFieldGrid>
          {fields.map((item, index) => (
            <Box
              key={item.id}
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
                p: 2,
              }}
            >
              <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                <Controller
                  name={`options.transformations.${index}.code`}
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <TextField
                      label={t("tools.coordinates.transformationCode")}
                      sx={{ flex: 1 }}
                      {...field}
                    />
                  )}
                />
                <Controller
                  name={`options.transformations.${index}.title`}
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <TextField
                      label={t("tools.title")}
                      sx={{ flex: 1 }}
                      {...field}
                    />
                  )}
                />
                <IconButton
                  onClick={() => remove(index)}
                  aria-label={t("common.delete")}
                >
                  <DeleteIcon />
                </IconButton>
              </Stack>
              <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                <Controller
                  name={`options.transformations.${index}.xtitle`}
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <TextField
                      label={t("tools.coordinates.transformationXTitle")}
                      sx={{ flex: 1 }}
                      {...field}
                    />
                  )}
                />
                <Controller
                  name={`options.transformations.${index}.ytitle`}
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <TextField
                      label={t("tools.coordinates.transformationYTitle")}
                      sx={{ flex: 1 }}
                      {...field}
                    />
                  )}
                />
                <Controller
                  name={`options.transformations.${index}.precision`}
                  control={control}
                  defaultValue={3}
                  render={({ field }) => (
                    <TextField
                      label={t("tools.coordinates.transformationPrecision")}
                      type="number"
                      slotProps={{ htmlInput: { min: 0, max: 7, step: 1 } }}
                      sx={{ flex: 1 }}
                      {...field}
                      onChange={(e) =>
                        field.onChange(Number(e.target.value))
                      }
                    />
                  )}
                />
              </Stack>
              <Controller
                name={`options.transformations.${index}.hint`}
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <TextField
                    label={t("tools.coordinates.transformationHint")}
                    fullWidth
                    sx={{ mb: 1 }}
                    {...field}
                  />
                )}
              />
              <Stack direction="row" spacing={2}>
                <Controller
                  name={`options.transformations.${index}.default`}
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={!!field.value}
                          onChange={(_, checked) => field.onChange(checked)}
                        />
                      }
                      label={t("tools.coordinates.transformationDefault")}
                    />
                  )}
                />
                <Controller
                  name={`options.transformations.${index}.inverseAxis`}
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={!!field.value}
                          onChange={(_, checked) => field.onChange(checked)}
                        />
                      }
                      label={t("tools.coordinates.transformationInverseAxis")}
                    />
                  )}
                />
              </Stack>
            </Box>
          ))}

          <Box
            sx={{
              border: "1px dashed",
              borderColor: "divider",
              borderRadius: 1,
              p: 2,
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {t("common.add")}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
              <TextField
                label={t("tools.coordinates.transformationCode")}
                value={newT.code}
                onChange={(e) => setNewT({ ...newT, code: e.target.value })}
                sx={{ flex: 1 }}
              />
              <TextField
                label={t("tools.title")}
                value={newT.title}
                onChange={(e) => setNewT({ ...newT, title: e.target.value })}
                sx={{ flex: 1 }}
              />
            </Stack>
            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
              <TextField
                label={t("tools.coordinates.transformationXTitle")}
                value={newT.xtitle}
                onChange={(e) => setNewT({ ...newT, xtitle: e.target.value })}
                sx={{ flex: 1 }}
              />
              <TextField
                label={t("tools.coordinates.transformationYTitle")}
                value={newT.ytitle}
                onChange={(e) => setNewT({ ...newT, ytitle: e.target.value })}
                sx={{ flex: 1 }}
              />
              <TextField
                label={t("tools.coordinates.transformationPrecision")}
                type="number"
                slotProps={{ htmlInput: { min: 0, max: 7, step: 1 } }}
                value={newT.precision}
                onChange={(e) =>
                  setNewT({ ...newT, precision: e.target.value })
                }
                sx={{ flex: 1 }}
              />
            </Stack>
            <TextField
              label={t("tools.coordinates.transformationHint")}
              fullWidth
              sx={{ mb: 1 }}
              value={newT.hint}
              onChange={(e) => setNewT({ ...newT, hint: e.target.value })}
            />
            <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={newT.default}
                    onChange={(_, checked) =>
                      setNewT({ ...newT, default: checked })
                    }
                  />
                }
                label={t("tools.coordinates.transformationDefault")}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={newT.inverseAxis}
                    onChange={(_, checked) =>
                      setNewT({ ...newT, inverseAxis: checked })
                    }
                  />
                }
                label={t("tools.coordinates.transformationInverseAxis")}
              />
              <Button
                startIcon={<AddIcon />}
                onClick={addTransformation}
                variant="outlined"
              >
                {t("common.add")}
              </Button>
            </Stack>
          </Box>
        </FormFieldGrid>
      </FormPanel>
    </>
  );
}
