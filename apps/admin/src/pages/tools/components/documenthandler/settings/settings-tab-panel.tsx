import {
  Alert,
  Checkbox,
  FormControl,
  FormControlLabel,
  Grid,
  Icon,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Tooltip,
} from "@mui/material";
import { OpenInNew as OpenInNewIcon } from "@mui/icons-material";
import { useQueries } from "@tanstack/react-query";
import {
  Control,
  Controller,
  FieldValues,
  useController,
  useWatch,
  UseFormSetValue,
} from "react-hook-form";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getDocuments, useFolders } from "@/api/documents";
import FormAccordion from "@/components/form-components/form-accordion";
import FormColorPicker from "@/components/form-components/form-color-picker";
import FormPanel from "@/components/form-components/form-panel";
import { FieldLabelWithHelp } from "@/components/form-components/field-help-tooltip";
import { AttachmentsEditor } from "../attachments/attachments-editor";
import { storedNumber } from "@/pages/tools/renderers/tool-option-parsers";

interface SettingsTabPanelProps {
  control: Control<FieldValues>;
  setValue: UseFormSetValue<FieldValues>;
  toolId?: number;
}

export function SettingsTabPanel({
  control,
  setValue,
  toolId,
}: SettingsTabPanelProps) {
  const { t } = useTranslation();
  const { data: folders = [] } = useFolders(toolId);

  const documentQueries = useQueries({
    queries: folders.map((folder) => ({
      queryKey: ["documents", toolId, folder.name],
      queryFn: () => getDocuments(toolId!, folder.name),
      enabled: toolId !== undefined,
      staleTime: 60_000,
    })),
  });

  const documents = useMemo(() => {
    const all = documentQueries.flatMap((query) => query.data ?? []);
    return [...all].sort((a, b) => a.name.localeCompare(b.name));
  }, [documentQueries]);

  const isLoadingDocuments =
    toolId !== undefined &&
    folders.length > 0 &&
    documentQueries.some((query) => query.isLoading);

  const bgColor =
    (useWatch({
      control,
      name: "options.defaultDocumentColorSettings.textAreaBackgroundColor",
    }) as string) ?? "";
  const dividerColor =
    (useWatch({
      control,
      name: "options.defaultDocumentColorSettings.textAreaDividerColor",
    }) as string) ?? "";
  const { field: tocActiveField } = useController({
    name: "options.tableOfContents.active",
    control,
  });
  const tocActive = !!tocActiveField.value;
  const hasFactBoxColors = !!(bgColor || dividerColor);
  const [factBoxColorsEnabled, setFactBoxColorsEnabled] =
    useState(hasFactBoxColors);
  const [prevHasFactBoxColors, setPrevHasFactBoxColors] =
    useState(hasFactBoxColors);

  if (hasFactBoxColors !== prevHasFactBoxColors) {
    setPrevHasFactBoxColors(hasFactBoxColors);
    setFactBoxColorsEnabled(hasFactBoxColors);
  }

  const handleFactBoxToggle = (_: React.SyntheticEvent, checked: boolean) => {
    setFactBoxColorsEnabled(checked);
    if (!checked) {
      setValue("options.defaultDocumentColorSettings.textAreaBackgroundColor", "", {
        shouldDirty: true,
      });
      setValue("options.defaultDocumentColorSettings.textAreaDividerColor", "", {
        shouldDirty: true,
      });
    }
  };

  return (
    <>
      <FormPanel title={t("common.information")}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              name="options.title"
              control={control}
              render={({ field }) => (
                <TextField
                  label={t("tools.title")}
                  fullWidth
                  {...field}
                  value={(field.value as string) ?? ""}
                />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              name="options.drawerButtonTitle"
              control={control}
              render={({ field }) => (
                <TextField
                  label={t("tools.documenthandler.drawerButtonTitle")}
                  fullWidth
                  {...field}
                  value={(field.value as string) ?? ""}
                />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              name="options.drawerTitle"
              control={control}
              render={({ field }) => (
                <TextField
                  label={t("tools.documenthandler.drawerTitle")}
                  fullWidth
                  {...field}
                  value={(field.value as string) ?? ""}
                />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              name="options.drawerButtonIcon"
              control={control}
              render={({ field }) => {
                const iconName = (field.value as string) ?? "";
                return (
                  <TextField
                    label={t("tools.documenthandler.drawerButtonIcon")}
                    fullWidth
                    {...field}
                    value={iconName}
                    slotProps={{
                      input: {
                        startAdornment: iconName ? (
                          <InputAdornment position="start">
                            <Icon sx={{ fontSize: 18 }}>{iconName}</Icon>
                          </InputAdornment>
                        ) : undefined,
                        endAdornment: (
                          <InputAdornment position="end">
                            <Tooltip title={t("tools.documenthandler.browseIcons")}>
                              <IconButton
                                size="small"
                                edge="end"
                                onClick={() =>
                                  window.open(
                                    "https://fonts.google.com/icons",
                                    "_blank",
                                    "noopener,noreferrer"
                                  )
                                }
                              >
                                <OpenInNewIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                );
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              name="options.documentOnStart"
              control={control}
              render={({ field }) => {
                const value = (field.value as string) ?? "";
                const valueInList = documents.some((doc) => doc.name === value);

                return (
                  <FormControl
                    fullWidth
                    disabled={toolId === undefined || isLoadingDocuments}
                  >
                    <InputLabel id="document-on-start-label">
                      {t("tools.documenthandler.documentOnStart")}
                    </InputLabel>
                    <Select
                      {...field}
                      labelId="document-on-start-label"
                      label={t("tools.documenthandler.documentOnStart")}
                      value={value}
                    >
                      <MenuItem value="">
                        <em>
                          {t(
                            "tools.documenthandler.menuEditor.fields.noDocument"
                          )}
                        </em>
                      </MenuItem>
                      {documents.map((doc) => (
                        <MenuItem key={doc.name} value={doc.name}>
                          {doc.title ? `${doc.title} (${doc.name})` : doc.name}
                        </MenuItem>
                      ))}
                      {value && !valueInList && (
                        <MenuItem value={value}>{value}</MenuItem>
                      )}
                    </Select>
                  </FormControl>
                );
              }}
            />
          </Grid>
        </Grid>
      </FormPanel>

      <FormAccordion title={t("tools.generalSettings")} defaultExpanded>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Controller
              name="options.customThemeUrl"
              control={control}
              render={({ field }) => (
                <TextField
                  label={t("tools.documenthandler.customThemeUrl")}
                  fullWidth
                  {...field}
                  value={(field.value as string) ?? ""}
                />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Controller
              name="options.showScrollButtonLimit"
              control={control}
              render={({ field }) => (
                <TextField
                  type="number"
                  label={t("tools.documenthandler.showScrollButtonLimit")}
                  fullWidth
                  name={field.name}
                  inputRef={field.ref}
                  onBlur={field.onBlur}
                  value={(field.value as number | string | null) ?? ""}
                  onChange={(event) => field.onChange(storedNumber(event.target.value))}
                />
              )}
            />
          </Grid>
        </Grid>

        <Grid container rowSpacing={0} columnSpacing={2} sx={{ mt: 2 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              name="options.searchImplemented"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!field.value}
                      onChange={(_, checked) => field.onChange(checked)}
                    />
                  }
                  label={t("tools.documenthandler.searchImplemented")}
                />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              name="options.enablePrint"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!field.value}
                      onChange={(_, checked) => field.onChange(checked)}
                    />
                  }
                  label={t("tools.documenthandler.enablePrint")}
                />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              name="options.consolidateDocumentLoading"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!field.value}
                      onChange={(_, checked) => field.onChange(checked)}
                    />
                  }
                  label={
                    <FieldLabelWithHelp
                      label={t(
                        "tools.documenthandler.consolidateDocumentLoading",
                      )}
                      help={t(
                        "tools.documenthandler.consolidateDocumentLoadingHelp",
                      )}
                    />
                  }
                />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              name="options.closePanelOnMapLinkOpen"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!field.value}
                      onChange={(_, checked) => field.onChange(checked)}
                    />
                  }
                  label={t("tools.documenthandler.closePanelOnMapLinkOpen")}
                />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              name="options.displayLoadingOnMapLinkOpen"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!field.value}
                      onChange={(_, checked) => field.onChange(checked)}
                    />
                  }
                  label={t("tools.documenthandler.displayLoadingOnMapLinkOpen")}
                />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              name="options.resizingEnabled"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!field.value}
                      onChange={(_, checked) => field.onChange(checked)}
                    />
                  }
                  label={t("tools.documenthandler.resizingEnabled")}
                />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              name="options.draggingEnabled"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!field.value}
                      onChange={(_, checked) => field.onChange(checked)}
                    />
                  }
                  label={t("tools.documenthandler.draggingEnabled")}
                />
              )}
            />
          </Grid>
        </Grid>
      </FormAccordion>

      <FormAccordion title={t("tools.documenthandler.tableOfContents")}>
        <Grid container spacing={2}>
          <Grid size={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={tocActive}
                  onChange={(_, checked) => tocActiveField.onChange(checked)}
                />
              }
              label={t("tools.active")}
            />
          </Grid>

          {tocActive && (
            <>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="options.tableOfContents.title"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      label={t("tools.title")}
                      fullWidth
                      {...field}
                      value={(field.value as string) ?? ""}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="options.tableOfContents.printMode"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel id="toc-print-mode-label">
                        {t("tools.documenthandler.tocPrintMode")}
                      </InputLabel>
                      <Select
                        {...field}
                        labelId="toc-print-mode-label"
                        label={t("tools.documenthandler.tocPrintMode")}
                        value={(field.value as string) ?? "none"}
                      >
                        <MenuItem value="full">
                          {t("tools.documenthandler.tocPrintModeFull")}
                        </MenuItem>
                        <MenuItem value="partial">
                          {t("tools.documenthandler.tocPrintModePartial")}
                        </MenuItem>
                        <MenuItem value="none">
                          {t("tools.documenthandler.tocPrintModeNone")}
                        </MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="options.tableOfContents.chapterLevelsToShow"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      type="number"
                      label={t("tools.documenthandler.chapterLevelsToShow")}
                      fullWidth
                      name={field.name}
                      inputRef={field.ref}
                      onBlur={field.onBlur}
                      value={(field.value as number | string | null) ?? ""}
                      onChange={(event) => field.onChange(storedNumber(event.target.value))}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="options.tableOfContents.chapterLevelsToShowForPrint"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      type="number"
                      label={t(
                        "tools.documenthandler.chapterLevelsToShowForPrint"
                      )}
                      fullWidth
                      name={field.name}
                      inputRef={field.ref}
                      onBlur={field.onBlur}
                      value={(field.value as number | string | null) ?? ""}
                      onChange={(event) => field.onChange(storedNumber(event.target.value))}
                    />
                  )}
                />
              </Grid>

              <Grid size={12}>
                <Controller
                  name="options.tableOfContents.expanded"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={!!field.value}
                          onChange={(_, checked) => field.onChange(checked)}
                        />
                      }
                      label={t("tools.documenthandler.tocExpanded")}
                    />
                  )}
                />
              </Grid>
            </>
          )}
        </Grid>
      </FormAccordion>

      <FormAccordion title={t("tools.documenthandler.factBox")}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 10 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={factBoxColorsEnabled}
                  onChange={handleFactBoxToggle}
                />
              }
              label={t("tools.active")}
            />
          </Grid>

          {factBoxColorsEnabled && (
            <>
              <Grid size={{ xs: 12, md: 10 }}>
                <Alert severity="warning" sx={{ mb: 1 }}>
                  {t("tools.documenthandler.factBoxColorWarning")}
                </Alert>
              </Grid>

              <Grid size={{ xs: 12, md: 3 }}>
                <FormColorPicker
                  label={t("tools.documenthandler.textAreaBackgroundColor")}
                  value={bgColor}
                  onChange={(hex) =>
                    setValue(
                      "options.defaultDocumentColorSettings.textAreaBackgroundColor",
                      hex,
                      { shouldDirty: true }
                    )
                  }
                />
              </Grid>

              <Grid size={{ xs: 12, md: 3 }}>
                <FormColorPicker
                  label={t("tools.documenthandler.textAreaDividerColor")}
                  value={dividerColor}
                  onChange={(hex) =>
                    setValue(
                      "options.defaultDocumentColorSettings.textAreaDividerColor",
                      hex,
                      { shouldDirty: true }
                    )
                  }
                />
              </Grid>
            </>
          )}
        </Grid>
      </FormAccordion>

      <FormAccordion title={t("tools.documenthandler.attachments.title")}>
        <AttachmentsEditor control={control} />
      </FormAccordion>
    </>
  );
}
