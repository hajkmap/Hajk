import { Grid2 as Grid } from "@mui/material";
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
import FormAccordion from "../../../components/form-components/form-accordion";
import { useTranslation } from "react-i18next";
import { Controller, FieldValues, useForm } from "react-hook-form";
import { SketchPicker } from "react-color";

export default function InfoClickRenderer({
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
      <FormPanel title={t("common.information")}>
        <Grid container>
          <Grid size={{ xs: 12, md: 12 }}>
            <Controller
              name="options.title"
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
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
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
          </Grid>
          <Grid size={{ xs: 12, md: 10 }}>
            <Controller
              name="options.title"
              control={control}
              defaultValue={tool?.options?.title ?? ""}
              render={({ field }) => (
                <TextField
                  label={t("tools.customTitleForMap")}
                  fullWidth
                  {...field}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 10 }}>
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
          </Grid>
          <Grid size={{ xs: 12, md: 10 }}>
            <Controller
              name="options.description"
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
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
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
        </Grid>
      </FormPanel>

      <FormAccordion title={t("tools.windowSettings")}>
        <Grid container>
          <Grid size={{ xs: 12, md: 10 }}>
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
          </Grid>
          <Grid size={{ xs: 12, md: 10 }}>
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
          </Grid>
          <Grid size={{ xs: 12, md: 10 }}>
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
          </Grid>
          <Grid size={{ xs: 12, md: 10 }}>
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
          </Grid>
        </Grid>
      </FormAccordion>

      <FormAccordion title={t("tools.generalSettings")}>
        <Grid container>
          <Grid size={{ xs: 12, md: 10 }}>
            <Controller
              name="options.access"
              control={control}
              defaultValue={tool?.options?.description ?? ""}
              render={({ field }) => (
                <TextField label={t("tools.access")} fullWidth {...field} />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 10 }}>
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
          </Grid>
          <Grid size={{ xs: 12, md: 10 }}>
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
          </Grid>
          <Grid size={{ xs: 12, md: 10 }}>
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
          </Grid>
          <Grid size={{ xs: 12, md: 10 }}>
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
          </Grid>
          <Grid size={{ xs: 12, md: 10 }}>
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
          </Grid>
        </Grid>
      </FormAccordion>

      <FormAccordion title={t("tools.linksApperance")}>
        <Grid container>
          <Grid size={{ xs: 12, md: 10 }}>
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
          </Grid>
          <Grid size={{ xs: 12, md: 10 }}>
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
          </Grid>
        </Grid>
      </FormAccordion>

      <FormAccordion title={t("tools.iconsAndMarkers")}>
        <Grid container>
          <Grid size={{ xs: 12, md: 10 }}>
            <Controller
              name="options.imageUrl"
              control={control}
              defaultValue={tool?.options?.imageUrl ?? ""}
              render={({ field }) => (
                <TextField label={t("tools.imageUrl")} fullWidth {...field} />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 10 }}>
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
          </Grid>

          <Grid size={{ xs: 12, md: 10 }}>
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
          </Grid>

          <Grid size={{ xs: 12, md: 10 }}>
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
          </Grid>

          <Grid size={{ xs: 12, md: 10 }}>
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
          </Grid>

          <Grid size={{ xs: 12, md: 12, lg: 6 }}>
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
                    color={field.value}
                    onChange={(color) => field.onChange(color.hex)}
                  />
                )}
              />
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 12, lg: 6 }}>
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
                    color={field.value}
                    onChange={(color) => field.onChange(color.hex)}
                  />
                )}
              />
            </FormControl>
          </Grid>
        </Grid>
      </FormAccordion>
    </>
  );
}
