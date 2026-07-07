import {
  TextField,
  FormGroup,
  FormControlLabel,
  FormControl,
  MenuItem,
  InputLabel,
  Select,
  Switch,
  Checkbox,
} from "@mui/material";
import FormPanel from "../../../components/form-components/form-panel";
import FormFieldGrid, {
  FormFieldRow,
} from "../../../components/form-components/form-field-grid";
import FormAccordion from "../../../components/form-components/form-accordion";
import FormContainer from "../../../components/form-components/form-container";
import { useTranslation } from "react-i18next";
import { Control, Controller, FieldValues, useForm } from "react-hook-form";
import { SketchPicker } from "react-color";
import { Tool } from "../../../api/tools";

function optionValueToFormString(value: unknown): string {
  if (value == null) return "";
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return String(value);
  }
  return "";
}

interface InfoClickRendererProps {
  tool: Tool;
  control?: Control<FieldValues>;
}

export default function InfoClickRenderer({ tool }: InfoClickRendererProps) {
  const { t } = useTranslation();
  const { control } = useForm<FieldValues>({
    defaultValues: {
      type: tool?.type ?? "",
      ...(tool?.options
        ? Object.fromEntries(
            Object.entries(tool.options).map(([k, v]) => [
              `options.${k}`,
              optionValueToFormString(v),
            ]),
          )
        : {}),
    },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  return (
    <FormContainer>
      <FormPanel title={t("common.information")}>
        <FormFieldGrid>
          <FormFieldRow>
            <Controller
              name="options.displayName"
              control={control}
              defaultValue={tool?.options?.title ?? ""}
              render={({ field }) => (
                <TextField
                  label={t("tools.displayName")}
                  fullWidth
                  {...field}
                />
              )}
            />
          </FormFieldRow>
          <FormFieldRow>
            <FormGroup>
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
                        size="medium"
                      />
                    }
                    label={t("tools.active")}
                  />
                )}
              />
            </FormGroup>
          </FormFieldRow>
          <FormFieldRow>
            <Controller
              name="options.customTitleForMap"
              control={control}
              defaultValue={tool?.options?.customTitleForMap ?? ""}
              render={({ field }) => (
                <TextField
                  label={t("tools.customTitleForMap")}
                  fullWidth
                  {...field}
                />
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
                  {...field}
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
        </FormFieldGrid>
      </FormPanel>

      <FormAccordion title={t("tools.windowSettings")}>
        <FormFieldGrid>
          <FormFieldRow>
            <FormControl fullWidth>
              <InputLabel id="window-placement" shrink>
                {t("tools.windowPlacement")}
              </InputLabel>
              <Controller
                name="options.windowPlacement"
                control={control}
                render={({ field }) => (
                  <Select
                    labelId="window-placement"
                    label={t("tools.windowPlacement")}
                    defaultValue="1"
                    displayEmpty
                    {...field}
                  >
                    <MenuItem value={"1"}>Left</MenuItem>
                    <MenuItem value={"2"}>Right</MenuItem>
                  </Select>
                )}
              />
            </FormControl>
          </FormFieldRow>
          <FormFieldRow>
            <Controller
              name="options.windowWidth"
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
          </FormFieldRow>
          <FormFieldRow>
            <FormControl fullWidth>
              <InputLabel id="window-height" shrink>
                {t("tools.windowHeight")}
              </InputLabel>
              <Controller
                name="options.window-height"
                control={control}
                render={({ field }) => (
                  <Select
                    labelId="window-height"
                    label={t("tools.windowHeight")}
                    defaultValue="1"
                    displayEmpty
                    {...field}
                  >
                    <MenuItem value={"1"}>Auto</MenuItem>
                    <MenuItem value={"2"}>Dynamic</MenuItem>
                  </Select>
                )}
              />
            </FormControl>
          </FormFieldRow>
          <FormFieldRow>
            <Controller
              name="options.windowSetWindowHeight"
              control={control}
              defaultValue={tool?.options?.width ?? ""}
              render={({ field }) => (
                <TextField
                  label={t("tools.windowSetWindowHeight")}
                  fullWidth
                  {...field}
                />
              )}
            />
          </FormFieldRow>
        </FormFieldGrid>
      </FormAccordion>

      <FormAccordion title={t("tools.generalSettings")}>
        <FormFieldGrid>
          <FormFieldRow>
            <Controller
              name="options.access"
              control={control}
              defaultValue={tool?.options?.description ?? ""}
              render={({ field }) => (
                <TextField label={t("tools.access")} fullWidth {...field} />
              )}
            />
          </FormFieldRow>
          <FormFieldRow>
            <Controller
              name="options.allowHtml"
              control={control}
              defaultValue={Boolean(tool?.options?.allowHtml ?? "")}
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
              name="options.useNewInfoClick"
              control={control}
              defaultValue={Boolean(tool?.options?.useNewInfoClick ?? "")}
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
              name="options.allowMoreCharacters"
              control={control}
              defaultValue={Boolean(tool?.options?.allowMoreCharacters ?? "")}
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
              name="options.markFeatures"
              control={control}
              defaultValue={Boolean(tool?.options?.markFeatures ?? "")}
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
              name="options.urlVerificationActive"
              control={control}
              defaultValue={!!tool?.options?.urlVerificationActive}
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
              <InputLabel id="linkColor" shrink>
                {t("tools.linkColor")}
              </InputLabel>
              <Controller
                name="options.linkColor"
                control={control}
                render={({ field }) => (
                  <Select
                    labelId="linkColor"
                    label={t("tools.linkColor")}
                    defaultValue="1"
                    displayEmpty
                    {...field}
                  >
                    <MenuItem value={"1"}>Primary</MenuItem>
                    <MenuItem value={"2"}>Secondary</MenuItem>
                    <MenuItem value={"3"}>Inherit</MenuItem>
                  </Select>
                )}
              />
            </FormControl>
          </FormFieldRow>
          <FormFieldRow>
            <FormControl fullWidth>
              <InputLabel id="underlined" shrink>
                {t("tools.underlined")}
              </InputLabel>
              <Controller
                name="options.underlined"
                control={control}
                render={({ field }) => (
                  <Select
                    labelId="underlined"
                    label={t("tools.underlined")}
                    defaultValue="1"
                    displayEmpty
                    {...field}
                  >
                    <MenuItem value={"1"}>Always</MenuItem>
                    <MenuItem value={"2"}>Hover</MenuItem>
                    <MenuItem value={"3"}>No</MenuItem>
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
              name="options.imageUrl"
              control={control}
              defaultValue={tool?.options?.imageUrl ?? ""}
              render={({ field }) => (
                <TextField label={t("tools.imageUrl")} fullWidth {...field} />
              )}
            />
          </FormFieldRow>

          <FormFieldRow>
            <Controller
              name="options.iconOffsetX"
              control={control}
              defaultValue={tool?.options?.iconOffsetX ?? ""}
              render={({ field }) => (
                <TextField
                  label={t("tools.iconOffsetX")}
                  fullWidth
                  type="number"
                  {...field}
                />
              )}
            />
          </FormFieldRow>

          <FormFieldRow>
            <Controller
              name="options.iconOffsetY"
              control={control}
              defaultValue={tool?.options?.iconOffsetY ?? ""}
              render={({ field }) => (
                <TextField
                  label={t("tools.iconOffsetY")}
                  fullWidth
                  type="number"
                  {...field}
                />
              )}
            />
          </FormFieldRow>

          <FormFieldRow>
            <Controller
              name="options.iconScale"
              control={control}
              defaultValue={tool?.options?.iconScale ?? ""}
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
              name="options.borderWidth"
              control={control}
              defaultValue={tool?.options?.borderWidth ?? ""}
              render={({ field }) => (
                <TextField
                  label={t("tools.borderWidthPx")}
                  fullWidth
                  type="number"
                  {...field}
                />
              )}
            />
          </FormFieldRow>

          <FormFieldRow>
            <FormControl fullWidth>
              <InputLabel id="borderColor" shrink>
                {t("tools.borderColor")}
              </InputLabel>
              <Controller
                name="options.borderColor"
                control={control}
                render={({ field }) => (
                  <SketchPicker
                    width="300px"
                    color={
                      typeof field.value === "string" ? field.value : "#000000"
                    }
                    onChange={(color) => field.onChange(color.hex)}
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
                render={({ field }) => (
                  <SketchPicker
                    width="300px"
                    color={
                      typeof field.value === "string" ? field.value : "#000000"
                    }
                    onChange={(color) => field.onChange(color.hex)}
                  />
                )}
              />
            </FormControl>
          </FormFieldRow>
        </FormFieldGrid>
      </FormAccordion>
    </FormContainer>
  );
}
