import { useEffect, useRef, useState } from "react";
import Grid from "@mui/material/Grid";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Typography,
} from "@mui/material";
import {
  Controller,
  useForm,
  useWatch,
  type UseFormRegisterReturn,
} from "react-hook-form";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import { useTranslation } from "react-i18next";
import FormPanel from "../../../components/form-components/form-panel";
import {
  InlineLabelWithHelp,
  SelectWithHelp,
  TextFieldWithHelp,
} from "../../../components/form-components/field-label-with-help";

export interface LayerInfoClickModalValues {
  caption?: string;
  legendUrl?: string;
  legendIcon?: string;
  style?: string;
  /** The service has a style named like this sublayer plus `_labels`. */
  hasLabelStyle?: boolean;
  infoclickIcon?: string;
  searchDisplayName?: string;
  secondaryLabelFields?: string;
  searchShortDisplayName?: string;
  searchUrl?: string;
  searchPropertyName?: string;
  searchOutputFormat?: string;
  searchGeometryField?: string;
}

type FormValues = Required<LayerInfoClickModalValues>;

interface LayerInfoClickModalProps {
  open: boolean;
  layerName: string;
  onClose: () => void;
  onSave: (data: LayerInfoClickModalValues) => void;
  initialValues?: LayerInfoClickModalValues;
  availableStyles?: { name: string }[];
  /** WMS service URL, for previewing the legend the map client fetches. */
  serviceUrl?: string;
}

/** The GetLegendGraphic request the map client makes when no legend is set. */
function automaticLegendUrl(serviceUrl: string, layer: string, style: string) {
  const glue = serviceUrl.includes("?") ? "&" : "?";
  return `${serviceUrl}${glue}SERVICE=WMS&REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&LAYER=${encodeURIComponent(layer)}&STYLE=${encodeURIComponent(style)}`;
}

type LegendSource = "icon" | "custom" | "automatic";

const LEGEND_PREVIEW_CAPTION: Record<LegendSource, string> = {
  icon: "layers.legendPreviewIcon",
  custom: "layers.legendPreviewCustom",
  automatic: "layers.legendPreviewAutomatic",
};

function LegendPreview({ src, source }: { src: string; source: LegendSource }) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<"loading" | "ok" | "failed">("loading");

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" component="p">
        {t(LEGEND_PREVIEW_CAPTION[source])}
      </Typography>
      <Box
        sx={{
          mt: 0.5,
          p: 1,
          border: 1,
          borderColor: "divider",
          borderRadius: 1,
          display: "inline-block",
          minWidth: 120,
          maxWidth: "100%",
          maxHeight: 240,
          overflow: "auto",
          bgcolor: "#fff",
        }}
      >
        {status === "failed" ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              gap: 1,
              maxWidth: 240,
              color: "warning.dark",
            }}
          >
            <WarningAmberOutlinedIcon fontSize="small" sx={{ mt: "1px" }} />
            <Typography variant="body2">
              {t(
                source === "automatic"
                  ? "layers.legendPreviewAutomaticFailed"
                  : "layers.legendPreviewFailed",
              )}
            </Typography>
          </Box>
        ) : (
          <img
            src={src}
            alt={t("layers.legend")}
            style={{
              display: status === "ok" ? "block" : "none",
              maxWidth: "100%",
            }}
            onLoad={() => setStatus("ok")}
            onError={() => setStatus("failed")}
          />
        )}
      </Box>
    </Box>
  );
}

const toFormValues = (values?: LayerInfoClickModalValues): FormValues => ({
  caption: values?.caption ?? "",
  legendUrl: values?.legendUrl ?? "",
  legendIcon: values?.legendIcon ?? "",
  style: values?.style ?? "",
  hasLabelStyle: values?.hasLabelStyle === true,
  infoclickIcon: values?.infoclickIcon ?? "",
  searchDisplayName: values?.searchDisplayName ?? "",
  secondaryLabelFields: values?.secondaryLabelFields ?? "",
  searchShortDisplayName: values?.searchShortDisplayName ?? "",
  searchUrl: values?.searchUrl ?? "",
  searchPropertyName: values?.searchPropertyName ?? "",
  searchOutputFormat: values?.searchOutputFormat ?? "",
  searchGeometryField: values?.searchGeometryField ?? "",
});

function FileUrlField({
  labelKey,
  helpKey,
  helperText,
  registration,
  onFile,
}: {
  labelKey: string;
  helpKey: string;
  helperText: string;
  registration: UseFormRegisterReturn;
  onFile: (fileName: string) => void;
}) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
      <Box sx={{ flex: "1 1 200px", minWidth: 0 }}>
        <TextFieldWithHelp
          labelKey={labelKey}
          helpKey={helpKey}
          fullWidth
          helperText={helperText}
          slotProps={{ inputLabel: { shrink: true } }}
          {...registration}
        />
      </Box>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={(event) => {
          // Only the file name is kept; there is no upload yet.
          const file = event.target.files?.[0];
          if (file) onFile(file.name);
          event.target.value = "";
        }}
        style={{ display: "none" }}
      />
      <Button
        variant="outlined"
        onClick={() => inputRef.current?.click()}
        sx={{ whiteSpace: "nowrap", flexShrink: 0 }}
      >
        {t("layers.uploadFile")}
      </Button>
    </Box>
  );
}

export default function LayerInfoClickModal({
  open,
  layerName,
  onClose,
  onSave,
  initialValues,
  availableStyles = [],
  serviceUrl = "",
}: LayerInfoClickModalProps) {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { isDirty },
  } = useForm<FormValues>({ defaultValues: toFormValues(initialValues) });

  // The parent passes a new object on every render. Keep the latest copy in a
  // ref so the form resets when the dialog opens, and not on each keystroke.
  const initialValuesRef = useRef(initialValues);
  useEffect(() => {
    initialValuesRef.current = initialValues;
  }, [initialValues]);
  useEffect(() => {
    if (open) reset(toFormValues(initialValuesRef.current));
  }, [open, layerName, reset]);

  const legendUrl = useWatch({ control, name: "legendUrl" }).trim();
  const legendIcon = useWatch({ control, name: "legendIcon" }).trim();
  const style = useWatch({ control, name: "style" });
  const previewSrc =
    legendIcon ||
    legendUrl ||
    (serviceUrl ? automaticLegendUrl(serviceUrl, layerName, style) : "");

  const onSubmit = (data: FormValues) => {
    if (isDirty) {
      const { hasLabelStyle, ...rest } = data;
      onSave({
        ...Object.fromEntries(
          Object.entries(rest).map(([key, value]) => [key, value || undefined]),
        ),
        hasLabelStyle,
      });
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {t("layers.layerSettings", { name: layerName })}
      </DialogTitle>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleSubmit(onSubmit)(e);
        }}
      >
        <DialogContent sx={{ maxHeight: "80vh" }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            {t("layers.featureInfo.templateMovedToTab")}
          </Alert>

          <FormPanel title={t("common.general")}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextFieldWithHelp
                  labelKey="layers.displayName"
                  helpKey="layers.help.displayName"
                  fullWidth
                  {...register("caption")}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="style"
                  control={control}
                  render={({ field }) => (
                    <SelectWithHelp
                      labelKey="layers.style"
                      helpKey="layers.help.style"
                      {...field}
                      displayEmpty
                      value={field.value ?? ""}
                      renderValue={(value) =>
                        value === "" ? "<default>" : String(value)
                      }
                    >
                      <MenuItem value="">{"<default>"}</MenuItem>
                      {availableStyles.map((s) => (
                        <MenuItem key={s.name} value={s.name}>
                          {s.name}
                        </MenuItem>
                      ))}
                    </SelectWithHelp>
                  )}
                />
              </Grid>
              <Grid size={12}>
                <Controller
                  name="hasLabelStyle"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={field.value}
                          onChange={(event) =>
                            field.onChange(event.target.checked)
                          }
                        />
                      }
                      label={
                        <InlineLabelWithHelp
                          label={t("layers.hasLabelStyle")}
                          help={t("layers.help.hasLabelStyle")}
                        />
                      }
                    />
                  )}
                />
              </Grid>
            </Grid>
          </FormPanel>

          <FormPanel title={t("layers.legend")}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t("layers.legendIntro")}
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 7 }}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <FileUrlField
                    labelKey="layers.legend"
                    helpKey="layers.help.sublayerLegend"
                    helperText={t("layers.sublayerLegendHelper")}
                    registration={register("legendUrl")}
                    onFile={(name) =>
                      setValue("legendUrl", name, { shouldDirty: true })
                    }
                  />
                  <FileUrlField
                    labelKey="layers.legendIcon"
                    helpKey="layers.help.sublayerLegendIcon"
                    helperText={t("layers.sublayerLegendIconHelper")}
                    registration={register("legendIcon")}
                    onFile={(name) =>
                      setValue("legendIcon", name, { shouldDirty: true })
                    }
                  />
                </Box>
              </Grid>
              {previewSrc && (
                <Grid size={{ xs: 12, md: 5 }}>
                  <LegendPreview
                    key={previewSrc}
                    src={previewSrc}
                    source={
                      legendIcon ? "icon" : legendUrl ? "custom" : "automatic"
                    }
                  />
                </Grid>
              )}
            </Grid>
          </FormPanel>

          <FormPanel title={t("common.infoclick")}>
            <TextFieldWithHelp
              labelKey="layers.infoClickIcon"
              helpKey="layers.help.infoClickIcon"
              fullWidth
              {...register("infoclickIcon")}
              helperText={t("layers.infoClickIconHelp")}
            />
          </FormPanel>

          <FormPanel title={t("layers.infoClickAndSearch")}>
            <Grid container spacing={2}>
              <Grid size={12}>
                <TextFieldWithHelp
                  labelKey="layers.displayFieldInResultList"
                  helpKey="layers.help.primaryDisplayFields"
                  fullWidth
                  {...register("searchDisplayName")}
                  helperText={t("layers.displayFieldInResultListHelp")}
                />
              </Grid>
              <Grid size={12}>
                <TextFieldWithHelp
                  labelKey="layers.secondaryDisplayFieldInResultList"
                  helpKey="layers.help.secondaryDisplayFields"
                  fullWidth
                  {...register("secondaryLabelFields")}
                  helperText={t("layers.secondaryDisplayFieldInResultListHelp")}
                />
              </Grid>
              <Grid size={12}>
                <TextFieldWithHelp
                  labelKey="layers.shortDisplayField"
                  helpKey="layers.help.shortDisplayFields"
                  fullWidth
                  {...register("searchShortDisplayName")}
                  helperText={t("layers.shortDisplayFieldHelp")}
                />
              </Grid>
            </Grid>
          </FormPanel>

          <FormPanel title={t("layers.search")}>
            <Grid container spacing={2}>
              <Grid size={12}>
                <TextFieldWithHelp
                  labelKey="layers.searchSettings.url"
                  helpKey="layers.help.searchUrl"
                  fullWidth
                  {...register("searchUrl")}
                />
              </Grid>
              <Grid size={12}>
                <TextFieldWithHelp
                  labelKey="layers.searchFields"
                  helpKey="layers.help.searchFields"
                  fullWidth
                  {...register("searchPropertyName")}
                  helperText={t("layers.searchFieldsHelp")}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextFieldWithHelp
                  labelKey="layers.searchSettings.outputFormat"
                  helpKey="layers.help.searchOutputFormat"
                  fullWidth
                  {...register("searchOutputFormat")}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextFieldWithHelp
                  labelKey="layers.searchSettings.geometryField"
                  helpKey="layers.help.geometryField"
                  fullWidth
                  {...register("searchGeometryField")}
                />
              </Grid>
            </Grid>
          </FormPanel>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>{t("common.cancel")}</Button>
          <Button type="submit" variant="contained">
            {t("common.dialog.okBtn")}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
