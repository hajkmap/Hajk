import {
  TextField,
  FormControlLabel,
  FormControl,
  MenuItem,
  InputLabel,
  Select,
  Checkbox,
} from "@mui/material";
import FormPanel from "../../../components/form-components/form-panel";
import FormFieldGrid, {
  FormFieldRow,
} from "../../../components/form-components/form-field-grid";
import FormAccordion from "../../../components/form-components/form-accordion";
import { useTranslation } from "react-i18next";
import { Control, Controller, FieldValues, useForm } from "react-hook-form";
import { SketchPicker, type RGBColor } from "react-color";
import { Tool } from "../../../api/tools";

const DEFAULT_STROKE_COLOR: RGBColor = { r: 200, g: 0, b: 0, a: 0.7 };
const DEFAULT_FILL_COLOR: RGBColor = { r: 255, g: 0, b: 0, a: 0.1 };

function toRgbColor(value: unknown, fallback: RGBColor): RGBColor {
  if (
    value &&
    typeof value === "object" &&
    "r" in value &&
    "g" in value &&
    "b" in value
  ) {
    return value as RGBColor;
  }
  return fallback;
}

interface InfoClickRendererProps {
  tool: Tool;
  control?: Control<FieldValues>;
}

export default function InfoClickRenderer({
  tool,
  control: parentControl,
}: InfoClickRendererProps) {
  const { t } = useTranslation();
  const anchor = Array.isArray(tool?.options?.anchor)
    ? (tool.options.anchor as [number, number])
    : [0.5, 1];

  const { control: localControl } = useForm<FieldValues>({
    defaultValues: {
      type: tool?.type ?? "infoclick",
      ...(tool?.options
        ? Object.fromEntries(
            Object.entries(tool.options).map(([k, v]) => [`options.${k}`, v]),
          )
        : {}),
      "options.anchor.0": anchor[0],
      "options.anchor.1": anchor[1],
    },
  });

  // Use the parent form's control when provided (keeps these fields in the
  // page's single save flow); otherwise fall back to a local, standalone form.
  const control = parentControl ?? localControl;

  return (
    <>
      <FormPanel title={t("common.information")}>
        <FormFieldGrid>
          <FormFieldRow>
            <Controller
              name="options.title"
              control={control}
              defaultValue={tool?.options?.title ?? ""}
              render={({ field }) => (
                <TextField label={t("tools.title")} fullWidth {...field} />
              )}
            />
          </FormFieldRow>
          <FormFieldRow>
            <Controller
              name="options.description"
              control={control}
              defaultValue={tool?.options?.description ?? ""}
              render={({ field }) => (
                <TextField
                  label={t("tools.description")}
                  fullWidth
                  multiline
                  rows={4}
                  {...field}
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
                  label={t("tools.instructionText")}
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

      <FormAccordion title={t("tools.generalSettings")}>
        <FormFieldGrid>
          <FormFieldRow>
            <Controller
              name="options.allowDangerousHtml"
              control={control}
              defaultValue={tool?.options?.allowDangerousHtml ?? true}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!field.value}
                      onChange={(_, checked) => field.onChange(checked)}
                    />
                  }
                  label={t("tools.allowHtml")}
                />
              )}
            />
          </FormFieldRow>
          <FormFieldRow>
            <Controller
              name="options.useNewInfoclick"
              control={control}
              defaultValue={Boolean(tool?.options?.useNewInfoclick)}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!field.value}
                      onChange={(_, checked) => field.onChange(checked)}
                    />
                  }
                  label={t("tools.useNewInfoClick")}
                />
              )}
            />
          </FormFieldRow>
          <FormFieldRow>
            <Controller
              name="options.useNewPlaceholderMatching"
              control={control}
              defaultValue={Boolean(tool?.options?.useNewPlaceholderMatching)}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!field.value}
                      onChange={(_, checked) => field.onChange(checked)}
                    />
                  }
                  label={t("tools.allowMoreCharacters")}
                />
              )}
            />
          </FormFieldRow>
          <FormFieldRow>
            <Controller
              name="options.useLevel1FeatureHighlight"
              control={control}
              defaultValue={Boolean(tool?.options?.useLevel1FeatureHighlight)}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!field.value}
                      onChange={(_, checked) => field.onChange(checked)}
                    />
                  }
                  label={t("tools.markFeatures")}
                />
              )}
            />
          </FormFieldRow>
          <FormFieldRow>
            <Controller
              name="options.transformLinkUri"
              control={control}
              defaultValue={tool?.options?.transformLinkUri ?? true}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!field.value}
                      onChange={(_, checked) => field.onChange(checked)}
                    />
                  }
                  label={t("tools.urlVerification")}
                />
              )}
            />
          </FormFieldRow>
        </FormFieldGrid>
      </FormAccordion>

      <FormAccordion title={t("tools.linksApperance")}>
        <FormFieldGrid>
          <FormFieldRow>
            <FormControl fullWidth>
              <InputLabel id="linksColor" shrink>
                {t("tools.linksColor")}
              </InputLabel>
              <Controller
                name="options.linksColor"
                control={control}
                defaultValue={tool?.options?.linksColor ?? "primary"}
                render={({ field }) => (
                  <Select
                    labelId="linksColor"
                    label={t("tools.linksColor")}
                    {...field}
                  >
                    <MenuItem value="primary">Primary</MenuItem>
                    <MenuItem value="secondary">Secondary</MenuItem>
                    <MenuItem value="inherit">Inherit</MenuItem>
                  </Select>
                )}
              />
            </FormControl>
          </FormFieldRow>
          <FormFieldRow>
            <FormControl fullWidth>
              <InputLabel id="linksUnderline" shrink>
                {t("tools.linksUnderline")}
              </InputLabel>
              <Controller
                name="options.linksUnderline"
                control={control}
                defaultValue={tool?.options?.linksUnderline ?? "always"}
                render={({ field }) => (
                  <Select
                    labelId="linksUnderline"
                    label={t("tools.linksUnderline")}
                    {...field}
                  >
                    <MenuItem value="always">Always</MenuItem>
                    <MenuItem value="hover">Hover</MenuItem>
                    <MenuItem value="no">No</MenuItem>
                  </Select>
                )}
              />
            </FormControl>
          </FormFieldRow>
        </FormFieldGrid>
      </FormAccordion>

      <FormAccordion title={t("tools.iconsAndMarkers")}>
        <FormFieldGrid>
          <FormFieldRow>
            <Controller
              name="options.src"
              control={control}
              defaultValue={tool?.options?.src ?? ""}
              render={({ field }) => (
                <TextField label={t("tools.imageUrl")} fullWidth {...field} />
              )}
            />
          </FormFieldRow>

          <FormFieldRow>
            <Controller
              name="options.anchor.0"
              control={control}
              defaultValue={anchor[0]}
              render={({ field }) => (
                <TextField
                  label={t("tools.iconAnchorX")}
                  fullWidth
                  type="number"
                  {...field}
                />
              )}
            />
          </FormFieldRow>

          <FormFieldRow>
            <Controller
              name="options.anchor.1"
              control={control}
              defaultValue={anchor[1]}
              render={({ field }) => (
                <TextField
                  label={t("tools.iconAnchorY")}
                  fullWidth
                  type="number"
                  {...field}
                />
              )}
            />
          </FormFieldRow>

          <FormFieldRow>
            <Controller
              name="options.scale"
              control={control}
              defaultValue={tool?.options?.scale ?? 0.15}
              render={({ field }) => (
                <TextField
                  label={t("tools.iconScale")}
                  fullWidth
                  type="number"
                  {...field}
                />
              )}
            />
          </FormFieldRow>

          <FormFieldRow>
            <Controller
              name="options.strokeWidth"
              control={control}
              defaultValue={tool?.options?.strokeWidth ?? 4}
              render={({ field }) => (
                <TextField
                  label={t("tools.strokeWidth")}
                  fullWidth
                  type="number"
                  {...field}
                />
              )}
            />
          </FormFieldRow>

          <FormFieldRow>
            <FormControl fullWidth>
              <InputLabel id="strokeColor" shrink>
                {t("tools.strokeColor")}
              </InputLabel>
              <Controller
                name="options.strokeColor"
                control={control}
                defaultValue={toRgbColor(
                  tool?.options?.strokeColor,
                  DEFAULT_STROKE_COLOR,
                )}
                render={({ field }) => (
                  <SketchPicker
                    color={toRgbColor(field.value, DEFAULT_STROKE_COLOR)}
                    onChangeComplete={(color) => field.onChange(color.rgb)}
                  />
                )}
              />
            </FormControl>
          </FormFieldRow>

          <FormFieldRow>
            <FormControl fullWidth>
              <InputLabel id="fillColor" shrink>
                {t("tools.fillColor")}
              </InputLabel>
              <Controller
                name="options.fillColor"
                control={control}
                defaultValue={toRgbColor(
                  tool?.options?.fillColor,
                  DEFAULT_FILL_COLOR,
                )}
                render={({ field }) => (
                  <SketchPicker
                    color={toRgbColor(field.value, DEFAULT_FILL_COLOR)}
                    onChangeComplete={(color) => field.onChange(color.rgb)}
                  />
                )}
              />
            </FormControl>
          </FormFieldRow>
        </FormFieldGrid>
      </FormAccordion>
    </>
  );
}
