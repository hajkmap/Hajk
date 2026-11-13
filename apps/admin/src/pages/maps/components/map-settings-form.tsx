import { useEffect, useRef, useState } from "react";
import {
  TextField,
  MenuItem,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Switch,
  Box,
  Badge,
  IconButton,
  Tooltip,
  alpha,
  type SxProps,
  type Theme,
} from "@mui/material";
import TuneIcon from "@mui/icons-material/Tune";
import {
  Control,
  Controller,
  FieldValues,
  UseFormRegister,
  UseFormSetValue,
  useWatch,
} from "react-hook-form";
import { useTranslation } from "react-i18next";
import FormAccordion from "../../../components/form-components/form-accordion";
import FormPanel from "../../../components/form-components/form-panel";
import FormFieldGrid, {
  FormFieldRow,
} from "../../../components/form-components/form-field-grid";
import SearchablePanel from "../../../components/form-components/searchable-panel";
import { SettingsSearchField } from "../../../components/form-components/searchable-field";
import {
  InlineLabelWithHelp,
  SelectWithHelp,
  TextFieldWithHelp,
} from "../../../components/form-components/field-label-with-help";
import FormColorPicker from "../../../components/form-components/form-color-picker";
import { useSettingsSearchLabels } from "../../../hooks/use-settings-search-labels";
import ProjectionsDialog from "./projections";
import MapScaleFields from "./map-scale-fields";
import AvailabilityStatus from "../../../components/availability/availability-status";
import {
  getMainProjectionChoices,
  groupProjectionCodes,
  usesZoomLevelFields,
} from "../projection-codes";
import { optionsForProjectionGroupChange } from "../map-scales";
import { useProjectionsWithUsage } from "../../../api/projections";

export type MapSettingsSection =
  "map" | "controls" | "appearance" | "content" | "search";

interface MapSettingsFormProps {
  register: UseFormRegister<FieldValues>;
  control: Control<FieldValues>;
  activeSection: MapSettingsSection;
  settingsSearchTerm: string;
  showSettingsSearchUi: boolean;
  getValues: () => FieldValues;
  setValue: UseFormSetValue<FieldValues>;
  /** The form values as last loaded or saved. */
  savedValues: FieldValues | null;
  /** Map-tools board asked to show this field. `highlightTick` changes on every request. */
  highlightField?: string | null;
  highlightTick?: number;
}

function MapCheckboxField({
  name,
  labelKey,
  control,
  settingsSearchTerm,
  showSettingsSearchUi,
  getValues,
}: {
  name: string;
  labelKey: string;
  control: Control<FieldValues>;
  settingsSearchTerm: string;
  showSettingsSearchUi: boolean;
  getValues: () => FieldValues;
}) {
  const { t, i18n } = useTranslation();
  const helpKey = `${labelKey}Help`;
  const label = t(labelKey as never);

  return (
    <SettingsSearchField
      labelKeys={[labelKey]}
      fields={[name]}
      searchTerm={settingsSearchTerm}
      allValues={showSettingsSearchUi ? getValues() : undefined}
    >
      <Box
        data-map-setting={name}
        sx={{
          width: "fit-content",
          maxWidth: "100%",
          borderRadius: 1,
          "&[data-highlighted='true']": {
            bgcolor: (theme) => alpha(theme.palette.warning.main, 0.22),
            boxShadow: (theme) =>
              `0 0 0 2px ${alpha(theme.palette.warning.main, 0.9)}`,
          },
        }}
      >
        <FormControlLabel
          control={
            <Controller
              name={name}
              control={control}
              render={({ field }) => (
                <Checkbox
                  checked={Boolean(field.value)}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
              )}
            />
          }
          label={
            i18n.exists(helpKey) ? (
              <InlineLabelWithHelp label={label} help={t(helpKey as never)} />
            ) : (
              label
            )
          }
        />
      </Box>
    </SettingsSearchField>
  );
}

function MapColorField({
  name,
  labelKey,
  control,
  settingsSearchTerm,
  showSettingsSearchUi,
  getValues,
  newRow,
}: {
  name: string;
  labelKey: string;
  control: Control<FieldValues>;
  settingsSearchTerm: string;
  showSettingsSearchUi: boolean;
  getValues: () => FieldValues;
  newRow?: boolean;
}) {
  const { t } = useTranslation();

  return (
    <SettingsSearchField
      labelKeys={[labelKey]}
      fields={[name]}
      synonyms={["color"]}
      searchTerm={settingsSearchTerm}
      allValues={showSettingsSearchUi ? getValues() : undefined}
    >
      <FormFieldRow newRow={newRow}>
        <Controller
          name={name}
          control={control}
          render={({ field }) => (
            <FormColorPicker
              label={t(labelKey as never)}
              size="medium"
              value={typeof field.value === "string" ? field.value : ""}
              onChange={(hex) => field.onChange(hex)}
            />
          )}
        />
      </FormFieldRow>
    </SettingsSearchField>
  );
}

/** Checkbox lists flow top-to-bottom in two columns from `md` up. */
const CHECKBOX_COLUMNS_SX: SxProps<Theme> = {
  display: "block",
  columns: { xs: 1, md: 2 },
  columnGap: 3,
  "& > *": { breakInside: "avoid" },
};

/**
 * Searchable text field. Uses the label-above layout with a help icon when a
 * `<labelKey>Help` translation exists, so fields in the same row line up.
 */
function MapTextField({
  name,
  labelKey,
  register,
  settingsSearchTerm,
  searchValues,
  synonyms,
  placeholder,
  type,
  inputMode,
  multiline,
  rows,
  fullWidth = false,
  span,
  newRow,
  readOnly = false,
}: {
  name: string;
  labelKey: string;
  register: UseFormRegister<FieldValues>;
  settingsSearchTerm: string;
  searchValues: FieldValues | undefined;
  synonyms?: string[];
  placeholder?: string;
  type?: string;
  inputMode?: "decimal" | "numeric";
  multiline?: boolean;
  rows?: number;
  fullWidth?: boolean;
  span?: 2;
  newRow?: boolean;
  readOnly?: boolean;
}) {
  const { t, i18n } = useTranslation();
  const helpKey = `${labelKey}Help`;
  const inputProps = {
    fullWidth: true,
    placeholder,
    type,
    multiline,
    rows,
    slotProps: { htmlInput: { inputMode, readOnly } },
    ...register(name),
  };

  return (
    <SettingsSearchField
      labelKeys={[labelKey]}
      fields={[name]}
      synonyms={synonyms}
      searchTerm={settingsSearchTerm}
      allValues={searchValues}
    >
      <FormFieldRow fullWidth={fullWidth} span={span} newRow={newRow}>
        {i18n.exists(helpKey) ? (
          <TextFieldWithHelp
            labelKey={labelKey}
            helpKey={helpKey}
            size="small"
            {...inputProps}
          />
        ) : (
          <TextField label={t(labelKey as never)} {...inputProps} />
        )}
      </FormFieldRow>
    </SettingsSearchField>
  );
}

export default function MapSettingsForm({
  register,
  control,
  activeSection,
  settingsSearchTerm,
  showSettingsSearchUi,
  getValues,
  setValue,
  savedValues,
  highlightField = null,
  highlightTick = 0,
}: MapSettingsFormProps) {
  const { t } = useTranslation();
  const settingsSearchLabels = useSettingsSearchLabels();
  const rootRef = useRef<HTMLDivElement>(null);
  const handledHighlightTick = useRef(0);
  const mapSelectorOn =
    useWatch({ control, name: "options.mapselector" }) === true;
  const linkedProjections = useWatch({ control, name: "projections" }) as
    string[] | undefined;
  const mainProjectionCode = useWatch({ control, name: "projection.code" }) as
    string | undefined;
  // One per EPSG number, matching the dialog's rows.
  const linkedProjectionCount = groupProjectionCodes(
    Array.from(
      new Set([
        ...(Array.isArray(linkedProjections) ? linkedProjections : []),
        ...(mainProjectionCode ? [mainProjectionCode] : []),
      ]),
    ),
  ).length;
  const [projectionsDialogOpen, setProjectionsDialogOpen] = useState(false);
  const usesZoomFields = usesZoomLevelFields(mainProjectionCode ?? "");
  const previousUsesZoomFields = useRef(usesZoomFields);
  const { data: projections } = useProjectionsWithUsage();

  useEffect(() => {
    if (previousUsesZoomFields.current === usesZoomFields) return;
    previousUsesZoomFields.current = usesZoomFields;
    if (!savedValues) return;
    const saved = savedValues as {
      projection: { code: string };
      options: Record<string, unknown>;
    };
    const options = optionsForProjectionGroupChange({
      usesZoomFields,
      savedUsesZoomFields: usesZoomLevelFields(saved.projection.code),
      savedOptions: saved.options,
      extent: projections?.find(({ code }) => code === mainProjectionCode)
        ?.extent,
    });
    for (const [key, value] of Object.entries(options ?? {})) {
      setValue(`options.${key}`, value, { shouldDirty: true });
    }
  }, [mainProjectionCode, projections, savedValues, setValue, usesZoomFields]);

  useEffect(() => {
    if (!highlightField || highlightTick === 0) return;
    if (highlightTick === handledHighlightTick.current) return;
    const root = rootRef.current;
    if (!root) return;
    const node = root.querySelector(
      `[data-map-setting="${CSS.escape(highlightField)}"]`,
    );
    if (!(node instanceof HTMLElement)) return;

    handledHighlightTick.current = highlightTick;
    const tick = String(highlightTick);
    root
      .querySelector("[data-highlighted='true']")
      ?.removeAttribute("data-highlighted");
    node.setAttribute("data-highlighted", "true");
    node.dataset.highlightTick = tick;
    window.requestAnimationFrame(() => {
      if (node.dataset.highlightTick !== tick) return;
      node.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    window.setTimeout(() => {
      if (node.dataset.highlightTick !== tick) return;
      node.removeAttribute("data-highlighted");
      delete node.dataset.highlightTick;
    }, 3200);
  }, [activeSection, highlightField, highlightTick]);

  const showMapSection = activeSection === "map" || showSettingsSearchUi;
  const showControlsSection =
    activeSection === "controls" || showSettingsSearchUi;
  const showAppearanceSection =
    activeSection === "appearance" || showSettingsSearchUi;
  const showContentSection =
    activeSection === "content" || showSettingsSearchUi;

  const searchValues = showSettingsSearchUi ? getValues() : undefined;

  const resolutionFields = [
    <MapTextField
      key="resolutions"
      name="options.resolutions"
      labelKey="map.resolutions"
      synonyms={["resolution"]}
      placeholder="4096, 2048, 1024, 512, …"
      span={2}
      newRow
      readOnly={!usesZoomFields}
      register={register}
      settingsSearchTerm={settingsSearchTerm}
      searchValues={searchValues}
    />,
    <MapTextField
      key="extraPrintResolutions"
      name="options.extraPrintResolutions"
      labelKey="map.printResolutions"
      synonyms={["print", "resolution"]}
      placeholder="0.5, 0.25, …"
      span={2}
      newRow
      readOnly={!usesZoomFields}
      register={register}
      settingsSearchTerm={settingsSearchTerm}
      searchValues={searchValues}
    />,
  ];

  return (
    <Box ref={rootRef}>
      {showMapSection && (
        <>
          <SearchablePanel
            panelTitleKeywords={settingsSearchLabels("common.general")}
            keywords={[
              ...settingsSearchLabels("map.name", "map.locked"),
              "name",
              "lock",
            ]}
            fields={["name", "locked"]}
            allValues={searchValues}
            searchTerm={settingsSearchTerm}
          >
            <FormPanel title={t("common.general")}>
              <FormFieldGrid columns={2} sx={{ alignItems: "center" }}>
                <SettingsSearchField
                  labelKeys={["map.name"]}
                  fields={["name"]}
                  synonyms={["name"]}
                  searchTerm={settingsSearchTerm}
                  allValues={searchValues}
                >
                  <FormFieldRow>
                    <TextField
                      label={t("map.name")}
                      fullWidth
                      {...register("name")}
                    />
                  </FormFieldRow>
                </SettingsSearchField>
                <SettingsSearchField
                  labelKeys={["map.locked"]}
                  fields={["locked"]}
                  synonyms={["lock"]}
                  searchTerm={settingsSearchTerm}
                  allValues={searchValues}
                >
                  <FormFieldRow>
                    <FormControlLabel
                      control={
                        <Controller
                          name="locked"
                          control={control}
                          render={({ field }) => (
                            <Switch
                              checked={Boolean(field.value)}
                              onChange={(e) => field.onChange(e.target.checked)}
                            />
                          )}
                        />
                      }
                      label={t("map.locked")}
                    />
                  </FormFieldRow>
                </SettingsSearchField>
              </FormFieldGrid>
            </FormPanel>
          </SearchablePanel>

          <SearchablePanel
            panelTitleKeywords={settingsSearchLabels("map.visibility")}
            keywords={[
              ...settingsSearchLabels(
                "map.visible",
                "map.visibleFrom",
                "map.visibleUntil",
              ),
              "availability",
              "available",
              "visibility",
              "hidden",
              "publish",
            ]}
            fields={[
              "options.visible",
              "options.visibleFrom",
              "options.visibleUntil",
            ]}
            allValues={searchValues}
            searchTerm={settingsSearchTerm}
          >
            <FormPanel title={t("map.visibility")}>
              <MapCheckboxField
                name="options.visible"
                labelKey="map.visible"
                control={control}
                settingsSearchTerm={settingsSearchTerm}
                showSettingsSearchUi={showSettingsSearchUi}
                getValues={getValues}
              />
              <FormFieldGrid columns={2}>
                <MapTextField
                  name="options.visibleFrom"
                  labelKey="map.visibleFrom"
                  type="datetime-local"
                  register={register}
                  settingsSearchTerm={settingsSearchTerm}
                  searchValues={searchValues}
                />
                <MapTextField
                  name="options.visibleUntil"
                  labelKey="map.visibleUntil"
                  type="datetime-local"
                  register={register}
                  settingsSearchTerm={settingsSearchTerm}
                  searchValues={searchValues}
                />
              </FormFieldGrid>
              <AvailabilityStatus control={control} />
            </FormPanel>
          </SearchablePanel>

          <SearchablePanel
            panelTitleKeywords={settingsSearchLabels("map.baseSettings")}
            keywords={[
              ...settingsSearchLabels(
                "map.projection",
                "map.projections",
                "map.startZoom",
                "map.maxZoom",
                "map.minZoom",
                "map.centerCoordinate",
                "map.origin",
                "map.extent",
                "map.resolutions",
                "map.printResolutions",
                "map.scales",
                "map.printScales",
              ),
              "projection",
              "zoom",
              "extent",
              "resolution",
              "scale",
              "skala",
            ]}
            fields={[
              "projection.code",
              "projections",
              "options.zoom",
              "options.maxZoom",
              "options.minZoom",
              "options.center",
              "options.origin",
              "options.extent",
              "options.resolutions",
              "options.extraPrintResolutions",
              "options.scales",
              "options.printScales",
              "options.startScale",
              "options.minScale",
              "options.maxScale",
            ]}
            allValues={searchValues}
            searchTerm={settingsSearchTerm}
          >
            <FormAccordion
              title={t("map.baseSettings")}
              titleDetail={mainProjectionCode}
            >
              <FormFieldGrid columns={4}>
                <SettingsSearchField
                  labelKeys={["map.projection", "map.projections"]}
                  fields={["projection.code", "projections"]}
                  synonyms={["projection", "epsg", "coordinate"]}
                  searchTerm={settingsSearchTerm}
                  allValues={searchValues}
                >
                  <FormFieldRow span={2}>
                    <Box
                      sx={{ display: "flex", alignItems: "flex-end", gap: 1 }}
                    >
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Controller
                          name="projection.code"
                          control={control}
                          render={({ field }) => (
                            <SelectWithHelp
                              labelKey="map.projection"
                              helpKey="map.projectionHelp"
                              {...field}
                              value={(field.value as string) ?? ""}
                            >
                              {getMainProjectionChoices(
                                linkedProjections,
                                field.value as string | undefined,
                              ).map((value) => (
                                <MenuItem key={value} value={value}>
                                  {value}
                                </MenuItem>
                              ))}
                            </SelectWithHelp>
                          )}
                        />
                      </Box>
                      <Tooltip
                        title={`${t("map.projections")} (${linkedProjectionCount})`}
                      >
                        <IconButton
                          aria-label={t("map.projections")}
                          onClick={() => setProjectionsDialogOpen(true)}
                          sx={{ mb: 0.25 }}
                        >
                          <Badge
                            badgeContent={linkedProjectionCount}
                            color="primary"
                            max={99}
                          >
                            <TuneIcon />
                          </Badge>
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <ProjectionsDialog
                      open={projectionsDialogOpen}
                      onClose={() => setProjectionsDialogOpen(false)}
                      control={control}
                    />
                  </FormFieldRow>
                </SettingsSearchField>
                <FormFieldRow fullWidth>
                  {usesZoomFields ? (
                    <FormFieldGrid columns={4}>
                      <MapTextField
                        name="options.zoom"
                        labelKey="map.startZoom"
                        synonyms={["zoom", "start"]}
                        inputMode="decimal"
                        placeholder="2"
                        newRow
                        register={register}
                        settingsSearchTerm={settingsSearchTerm}
                        searchValues={searchValues}
                      />
                      <MapTextField
                        name="options.maxZoom"
                        labelKey="map.maxZoom"
                        synonyms={["zoom", "max"]}
                        type="number"
                        register={register}
                        settingsSearchTerm={settingsSearchTerm}
                        searchValues={searchValues}
                      />
                      <MapTextField
                        name="options.minZoom"
                        labelKey="map.minZoom"
                        synonyms={["zoom", "min"]}
                        type="number"
                        register={register}
                        settingsSearchTerm={settingsSearchTerm}
                        searchValues={searchValues}
                      />
                      {resolutionFields}
                    </FormFieldGrid>
                  ) : (
                    <MapScaleFields
                      control={control}
                      getValues={getValues}
                      setValue={setValue}
                      settingsSearchTerm={settingsSearchTerm}
                      searchValues={searchValues}
                    >
                      {resolutionFields}
                    </MapScaleFields>
                  )}
                </FormFieldRow>
                <MapTextField
                  name="options.center"
                  labelKey="map.centerCoordinate"
                  synonyms={["center", "coordinate"]}
                  placeholder="110600, 6283796"
                  newRow
                  register={register}
                  settingsSearchTerm={settingsSearchTerm}
                  searchValues={searchValues}
                />
                <MapTextField
                  name="options.origin"
                  labelKey="map.origin"
                  placeholder="0, 0"
                  register={register}
                  settingsSearchTerm={settingsSearchTerm}
                  searchValues={searchValues}
                />
                <MapTextField
                  name="options.extent"
                  labelKey="map.extent"
                  placeholder="minX, minY, maxX, maxY"
                  span={2}
                  newRow
                  register={register}
                  settingsSearchTerm={settingsSearchTerm}
                  searchValues={searchValues}
                />
              </FormFieldGrid>
            </FormAccordion>
          </SearchablePanel>

          <SearchablePanel
            panelTitleKeywords={settingsSearchLabels("map.extraSettings")}
            keywords={[
              ...settingsSearchLabels(
                "map.constrainResolution",
                "map.constrainOnlyCenter",
                "map.constrainResolutionMobile",
                "map.enableDownloadLink",
                "map.enableAppStateInHash",
                "map.confirmOnWindowClose",
                "map.logoLight",
                "map.logoDark",
                "map.legendOptions",
                "map.crossOrigin",
              ),
              "logo",
              "cookie",
              "download",
            ]}
            fields={[
              "options.constrainResolution",
              "options.constrainOnlyCenter",
              "options.constrainResolutionMobile",
              "options.enableDownloadLink",
              "options.enableAppStateInHash",
              "options.confirmOnWindowClose",
              "options.logoLight",
              "options.logoDark",
              "options.geoserverLegendOptions",
              "options.crossOrigin",
            ]}
            allValues={searchValues}
            searchTerm={settingsSearchTerm}
          >
            <FormPanel title={t("map.extraSettings")}>
              <FormFieldGrid columns={2}>
                <FormFieldRow fullWidth>
                  <FormGroup sx={CHECKBOX_COLUMNS_SX}>
                    <MapCheckboxField
                      name="options.constrainResolution"
                      labelKey="map.constrainResolution"
                      control={control}
                      settingsSearchTerm={settingsSearchTerm}
                      showSettingsSearchUi={showSettingsSearchUi}
                      getValues={getValues}
                    />
                    <MapCheckboxField
                      name="options.constrainOnlyCenter"
                      labelKey="map.constrainOnlyCenter"
                      control={control}
                      settingsSearchTerm={settingsSearchTerm}
                      showSettingsSearchUi={showSettingsSearchUi}
                      getValues={getValues}
                    />
                    <MapCheckboxField
                      name="options.constrainResolutionMobile"
                      labelKey="map.constrainResolutionMobile"
                      control={control}
                      settingsSearchTerm={settingsSearchTerm}
                      showSettingsSearchUi={showSettingsSearchUi}
                      getValues={getValues}
                    />
                    <MapCheckboxField
                      name="options.enableDownloadLink"
                      labelKey="map.enableDownloadLink"
                      control={control}
                      settingsSearchTerm={settingsSearchTerm}
                      showSettingsSearchUi={showSettingsSearchUi}
                      getValues={getValues}
                    />
                    <MapCheckboxField
                      name="options.enableAppStateInHash"
                      labelKey="map.enableAppStateInHash"
                      control={control}
                      settingsSearchTerm={settingsSearchTerm}
                      showSettingsSearchUi={showSettingsSearchUi}
                      getValues={getValues}
                    />
                    <MapCheckboxField
                      name="options.confirmOnWindowClose"
                      labelKey="map.confirmOnWindowClose"
                      control={control}
                      settingsSearchTerm={settingsSearchTerm}
                      showSettingsSearchUi={showSettingsSearchUi}
                      getValues={getValues}
                    />
                  </FormGroup>
                </FormFieldRow>
                <MapTextField
                  name="options.logoLight"
                  labelKey="map.logoLight"
                  synonyms={["logo", "light"]}
                  register={register}
                  settingsSearchTerm={settingsSearchTerm}
                  searchValues={searchValues}
                />
                <MapTextField
                  name="options.logoDark"
                  labelKey="map.logoDark"
                  synonyms={["logo", "dark"]}
                  register={register}
                  settingsSearchTerm={settingsSearchTerm}
                  searchValues={searchValues}
                />
                <MapTextField
                  name="options.geoserverLegendOptions"
                  labelKey="map.legendOptions"
                  synonyms={["legend"]}
                  register={register}
                  settingsSearchTerm={settingsSearchTerm}
                  searchValues={searchValues}
                />
                <MapTextField
                  name="options.crossOrigin"
                  labelKey="map.crossOrigin"
                  register={register}
                  settingsSearchTerm={settingsSearchTerm}
                  searchValues={searchValues}
                />
              </FormFieldGrid>
            </FormPanel>
          </SearchablePanel>
        </>
      )}

      {showControlsSection && (
        <>
          <SearchablePanel
            panelTitleKeywords={settingsSearchLabels("map.extraMapControls")}
            keywords={[
              ...settingsSearchLabels(
                "map.mapselector",
                "map.mapSelectorStyle",
                "map.mapcleaner",
                "map.mapresetter",
                "map.showThemeToggler",
                "map.showUserAvatar",
                "map.showRecentlyUsedPlugins",
              ),
              "theme",
              "avatar",
              "plugin",
            ]}
            fields={[
              "options.mapselector",
              "options.mapSelectorStyle",
              "options.mapcleaner",
              "options.mapresetter",
              "options.showThemeToggler",
              "options.showUserAvatar",
              "options.showRecentlyUsedPlugins",
            ]}
            allValues={searchValues}
            searchTerm={settingsSearchTerm}
          >
            <FormPanel title={t("map.extraMapControls")}>
              <FormFieldGrid columns={1}>
                <FormFieldRow>
                  <FormGroup sx={CHECKBOX_COLUMNS_SX}>
                    <MapCheckboxField
                      name="options.mapselector"
                      labelKey="map.mapselector"
                      control={control}
                      settingsSearchTerm={settingsSearchTerm}
                      showSettingsSearchUi={showSettingsSearchUi}
                      getValues={getValues}
                    />
                    {mapSelectorOn ? (
                      <Box
                        data-map-setting="options.mapSelectorStyle"
                        sx={{
                          pl: 4,
                          pr: 1,
                          pb: 1,
                          width: "100%",
                          maxWidth: "100%",
                          minWidth: 0,
                          boxSizing: "border-box",
                          borderRadius: 1,
                          "&[data-highlighted='true']": {
                            bgcolor: (theme) =>
                              alpha(theme.palette.warning.main, 0.22),
                            boxShadow: (theme) =>
                              `0 0 0 2px ${alpha(theme.palette.warning.main, 0.9)}`,
                          },
                        }}
                      >
                        <Controller
                          name="options.mapSelectorStyle"
                          control={control}
                          render={({ field }) => {
                            const styleValue =
                              field.value === "dropdown"
                                ? "dropdown"
                                : "button";
                            const styleLabel = t(
                              styleValue === "dropdown"
                                ? "map.mapSelectorStyleDropdown"
                                : "map.mapSelectorStyleButton",
                            );
                            return (
                              <SelectWithHelp
                                labelKey="map.mapSelectorStyle"
                                helpKey="map.mapSelectorStyleHelp"
                                fullWidth
                                {...field}
                                value={styleValue}
                                onChange={(event) =>
                                  field.onChange(event.target.value)
                                }
                                title={styleLabel}
                                sx={{
                                  minWidth: 0,
                                  maxWidth: "100%",
                                  "& .MuiSelect-select": {
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  },
                                }}
                              >
                                <MenuItem
                                  value="button"
                                  sx={{ whiteSpace: "normal" }}
                                >
                                  {t("map.mapSelectorStyleButton")}
                                </MenuItem>
                                <MenuItem
                                  value="dropdown"
                                  sx={{ whiteSpace: "normal" }}
                                >
                                  {t("map.mapSelectorStyleDropdown")}
                                </MenuItem>
                              </SelectWithHelp>
                            );
                          }}
                        />
                      </Box>
                    ) : null}
                    <MapCheckboxField
                      name="options.mapcleaner"
                      labelKey="map.mapcleaner"
                      control={control}
                      settingsSearchTerm={settingsSearchTerm}
                      showSettingsSearchUi={showSettingsSearchUi}
                      getValues={getValues}
                    />
                    <MapCheckboxField
                      name="options.mapresetter"
                      labelKey="map.mapresetter"
                      control={control}
                      settingsSearchTerm={settingsSearchTerm}
                      showSettingsSearchUi={showSettingsSearchUi}
                      getValues={getValues}
                    />
                    <MapCheckboxField
                      name="options.showThemeToggler"
                      labelKey="map.showThemeToggler"
                      control={control}
                      settingsSearchTerm={settingsSearchTerm}
                      showSettingsSearchUi={showSettingsSearchUi}
                      getValues={getValues}
                    />
                    <MapCheckboxField
                      name="options.showUserAvatar"
                      labelKey="map.showUserAvatar"
                      control={control}
                      settingsSearchTerm={settingsSearchTerm}
                      showSettingsSearchUi={showSettingsSearchUi}
                      getValues={getValues}
                    />
                    <MapCheckboxField
                      name="options.showRecentlyUsedPlugins"
                      labelKey="map.showRecentlyUsedPlugins"
                      control={control}
                      settingsSearchTerm={settingsSearchTerm}
                      showSettingsSearchUi={showSettingsSearchUi}
                      getValues={getValues}
                    />
                  </FormGroup>
                </FormFieldRow>
              </FormFieldGrid>
            </FormPanel>
          </SearchablePanel>

          <SearchablePanel
            panelTitleKeywords={settingsSearchLabels("map.interactions")}
            keywords={[
              ...settingsSearchLabels(
                "map.altShiftDragRotate",
                "map.onFocusOnly",
                "map.doubleClickZoom",
                "map.keyboard",
                "map.mouseWheelZoom",
                "map.shiftDragZoom",
                "map.dragPan",
                "map.pinchRotate",
                "map.pinchZoom",
                "map.zoomLevelDelta",
                "map.zoomAnimationDuration",
              ),
              "interaction",
              "zoom",
              "pan",
            ]}
            fields={[
              "options.altShiftDragRotate",
              "options.onFocusOnly",
              "options.doubleClickZoom",
              "options.keyboard",
              "options.mouseWheelZoom",
              "options.shiftDragZoom",
              "options.dragPan",
              "options.pinchRotate",
              "options.pinchZoom",
              "options.zoomDelta",
              "options.zoomDuration",
            ]}
            allValues={searchValues}
            searchTerm={settingsSearchTerm}
          >
            <FormPanel title={t("map.interactions")}>
              <FormFieldGrid columns={2}>
                <FormFieldRow fullWidth>
                  <FormGroup sx={CHECKBOX_COLUMNS_SX}>
                    <MapCheckboxField
                      name="options.altShiftDragRotate"
                      labelKey="map.altShiftDragRotate"
                      control={control}
                      settingsSearchTerm={settingsSearchTerm}
                      showSettingsSearchUi={showSettingsSearchUi}
                      getValues={getValues}
                    />
                    <MapCheckboxField
                      name="options.onFocusOnly"
                      labelKey="map.onFocusOnly"
                      control={control}
                      settingsSearchTerm={settingsSearchTerm}
                      showSettingsSearchUi={showSettingsSearchUi}
                      getValues={getValues}
                    />
                    <MapCheckboxField
                      name="options.doubleClickZoom"
                      labelKey="map.doubleClickZoom"
                      control={control}
                      settingsSearchTerm={settingsSearchTerm}
                      showSettingsSearchUi={showSettingsSearchUi}
                      getValues={getValues}
                    />
                    <MapCheckboxField
                      name="options.keyboard"
                      labelKey="map.keyboard"
                      control={control}
                      settingsSearchTerm={settingsSearchTerm}
                      showSettingsSearchUi={showSettingsSearchUi}
                      getValues={getValues}
                    />
                    <MapCheckboxField
                      name="options.mouseWheelZoom"
                      labelKey="map.mouseWheelZoom"
                      control={control}
                      settingsSearchTerm={settingsSearchTerm}
                      showSettingsSearchUi={showSettingsSearchUi}
                      getValues={getValues}
                    />
                    <MapCheckboxField
                      name="options.shiftDragZoom"
                      labelKey="map.shiftDragZoom"
                      control={control}
                      settingsSearchTerm={settingsSearchTerm}
                      showSettingsSearchUi={showSettingsSearchUi}
                      getValues={getValues}
                    />
                    <MapCheckboxField
                      name="options.dragPan"
                      labelKey="map.dragPan"
                      control={control}
                      settingsSearchTerm={settingsSearchTerm}
                      showSettingsSearchUi={showSettingsSearchUi}
                      getValues={getValues}
                    />
                    <MapCheckboxField
                      name="options.pinchRotate"
                      labelKey="map.pinchRotate"
                      control={control}
                      settingsSearchTerm={settingsSearchTerm}
                      showSettingsSearchUi={showSettingsSearchUi}
                      getValues={getValues}
                    />
                    <MapCheckboxField
                      name="options.pinchZoom"
                      labelKey="map.pinchZoom"
                      control={control}
                      settingsSearchTerm={settingsSearchTerm}
                      showSettingsSearchUi={showSettingsSearchUi}
                      getValues={getValues}
                    />
                  </FormGroup>
                </FormFieldRow>
                <MapTextField
                  name="options.zoomDelta"
                  labelKey="map.zoomLevelDelta"
                  synonyms={["zoom"]}
                  type="number"
                  register={register}
                  settingsSearchTerm={settingsSearchTerm}
                  searchValues={searchValues}
                />
                <MapTextField
                  name="options.zoomDuration"
                  labelKey="map.zoomAnimationDuration"
                  synonyms={["zoom", "animation"]}
                  type="number"
                  register={register}
                  settingsSearchTerm={settingsSearchTerm}
                  searchValues={searchValues}
                />
              </FormFieldGrid>
            </FormPanel>
          </SearchablePanel>
        </>
      )}

      {showAppearanceSection && (
        <SearchablePanel
          panelTitleKeywords={settingsSearchLabels("map.colors")}
          keywords={[
            ...settingsSearchLabels(
              "map.preferredColorScheme",
              "map.primaryColor",
              "map.secondaryColor",
              "map.colorSchemeUser",
              "map.colorSchemeLight",
              "map.colorSchemeDark",
            ),
            "color",
            "theme",
            "dark",
            "light",
          ]}
          fields={[
            "options.colors.preferredColorScheme",
            "options.colors.primaryColor",
            "options.colors.secondaryColor",
          ]}
          allValues={searchValues}
          searchTerm={settingsSearchTerm}
        >
          <FormPanel title={t("map.colors")}>
            <FormFieldGrid columns={2}>
              <SettingsSearchField
                labelKeys={["map.preferredColorScheme"]}
                fields={["options.colors.preferredColorScheme"]}
                synonyms={["color", "theme", "dark", "light"]}
                searchTerm={settingsSearchTerm}
                allValues={searchValues}
              >
                <FormFieldRow>
                  <Controller
                    name="options.colors.preferredColorScheme"
                    control={control}
                    render={({ field }) => (
                      <SelectWithHelp
                        labelKey="map.preferredColorScheme"
                        helpKey="map.preferredColorSchemeHelp"
                        {...field}
                        value={(field.value as string) ?? ""}
                      >
                        <MenuItem value="user">
                          {t("map.colorSchemeUser")}
                        </MenuItem>
                        <MenuItem value="light">
                          {t("map.colorSchemeLight")}
                        </MenuItem>
                        <MenuItem value="dark">
                          {t("map.colorSchemeDark")}
                        </MenuItem>
                      </SelectWithHelp>
                    )}
                  />
                </FormFieldRow>
              </SettingsSearchField>
              <MapColorField
                name="options.colors.primaryColor"
                labelKey="map.primaryColor"
                newRow
                control={control}
                settingsSearchTerm={settingsSearchTerm}
                showSettingsSearchUi={showSettingsSearchUi}
                getValues={getValues}
              />
              <MapColorField
                name="options.colors.secondaryColor"
                labelKey="map.secondaryColor"
                control={control}
                settingsSearchTerm={settingsSearchTerm}
                showSettingsSearchUi={showSettingsSearchUi}
                getValues={getValues}
              />
            </FormFieldGrid>
          </FormPanel>
        </SearchablePanel>
      )}

      {showAppearanceSection && (
        <SearchablePanel
          panelTitleKeywords={settingsSearchLabels("map.sidepanel")}
          keywords={[
            ...settingsSearchLabels(
              "map.drawerStatic",
              "map.drawerVisible",
              "map.drawerVisibleMobile",
              "map.drawerPermanent",
              "map.drawerContent",
              "map.drawerTitle",
              "map.drawerButtonTitle",
              "map.drawerButtonIcon",
            ),
            "drawer",
            "panel",
            "sidebar",
          ]}
          fields={[
            "options.drawerStatic",
            "options.drawerVisible",
            "options.drawerVisibleMobile",
            "options.drawerPermanent",
            "options.activeDrawerOnStart",
            "options.drawerTitle",
            "options.drawerButtonTitle",
            "options.drawerButtonIcon",
          ]}
          allValues={searchValues}
          searchTerm={settingsSearchTerm}
        >
          <FormPanel title={t("map.sidepanel")}>
            <FormFieldGrid columns={2}>
              <FormFieldRow fullWidth>
                <FormGroup sx={CHECKBOX_COLUMNS_SX}>
                  <MapCheckboxField
                    name="options.drawerStatic"
                    labelKey="map.drawerStatic"
                    control={control}
                    settingsSearchTerm={settingsSearchTerm}
                    showSettingsSearchUi={showSettingsSearchUi}
                    getValues={getValues}
                  />
                  <MapCheckboxField
                    name="options.drawerVisible"
                    labelKey="map.drawerVisible"
                    control={control}
                    settingsSearchTerm={settingsSearchTerm}
                    showSettingsSearchUi={showSettingsSearchUi}
                    getValues={getValues}
                  />
                  <MapCheckboxField
                    name="options.drawerVisibleMobile"
                    labelKey="map.drawerVisibleMobile"
                    control={control}
                    settingsSearchTerm={settingsSearchTerm}
                    showSettingsSearchUi={showSettingsSearchUi}
                    getValues={getValues}
                  />
                  <MapCheckboxField
                    name="options.drawerPermanent"
                    labelKey="map.drawerPermanent"
                    control={control}
                    settingsSearchTerm={settingsSearchTerm}
                    showSettingsSearchUi={showSettingsSearchUi}
                    getValues={getValues}
                  />
                </FormGroup>
              </FormFieldRow>
              <MapTextField
                name="options.activeDrawerOnStart"
                labelKey="map.drawerContent"
                synonyms={["drawer"]}
                register={register}
                settingsSearchTerm={settingsSearchTerm}
                searchValues={searchValues}
              />
              <MapTextField
                name="options.drawerTitle"
                labelKey="map.drawerTitle"
                synonyms={["drawer", "title"]}
                register={register}
                settingsSearchTerm={settingsSearchTerm}
                searchValues={searchValues}
              />
              <MapTextField
                name="options.drawerButtonTitle"
                labelKey="map.drawerButtonTitle"
                synonyms={["drawer", "button"]}
                register={register}
                settingsSearchTerm={settingsSearchTerm}
                searchValues={searchValues}
              />
              <SettingsSearchField
                labelKeys={["map.drawerButtonIcon"]}
                fields={["options.drawerButtonIcon"]}
                synonyms={["drawer", "icon"]}
                searchTerm={settingsSearchTerm}
                allValues={searchValues}
              >
                <FormFieldRow>
                  <Controller
                    name="options.drawerButtonIcon"
                    control={control}
                    render={({ field }) => (
                      <SelectWithHelp
                        labelKey="map.drawerButtonIcon"
                        helpKey="map.drawerButtonIconHelp"
                        {...field}
                        value={(field.value as string) ?? ""}
                      >
                        <MenuItem value="MapIcon">MapIcon</MenuItem>
                        <MenuItem value="MenuIcon">MenuIcon</MenuItem>
                      </SelectWithHelp>
                    )}
                  />
                </FormFieldRow>
              </SettingsSearchField>
            </FormFieldGrid>
          </FormPanel>
        </SearchablePanel>
      )}

      {showContentSection && (
        <>
          <SearchablePanel
            panelTitleKeywords={settingsSearchLabels("map.cookies")}
            keywords={[
              ...settingsSearchLabels(
                "map.showCookieNotice",
                "map.cookieUse3dPart",
                "map.showCookieNoticeButton",
                "map.cookieLink",
                "map.cookieMessage",
              ),
              "cookie",
              "gdpr",
            ]}
            fields={[
              "options.showCookieNotice",
              "options.cookieUse3dPart",
              "options.showCookieNoticeButton",
              "options.defaultCookieNoticeUrl",
              "options.defaultCookieNoticeMessage",
            ]}
            allValues={searchValues}
            searchTerm={settingsSearchTerm}
          >
            <FormPanel title={t("map.cookies")}>
              <FormFieldGrid columns={2}>
                <FormFieldRow fullWidth>
                  <FormGroup sx={CHECKBOX_COLUMNS_SX}>
                    <MapCheckboxField
                      name="options.showCookieNotice"
                      labelKey="map.showCookieNotice"
                      control={control}
                      settingsSearchTerm={settingsSearchTerm}
                      showSettingsSearchUi={showSettingsSearchUi}
                      getValues={getValues}
                    />
                    <MapCheckboxField
                      name="options.cookieUse3dPart"
                      labelKey="map.cookieUse3dPart"
                      control={control}
                      settingsSearchTerm={settingsSearchTerm}
                      showSettingsSearchUi={showSettingsSearchUi}
                      getValues={getValues}
                    />
                    <MapCheckboxField
                      name="options.showCookieNoticeButton"
                      labelKey="map.showCookieNoticeButton"
                      control={control}
                      settingsSearchTerm={settingsSearchTerm}
                      showSettingsSearchUi={showSettingsSearchUi}
                      getValues={getValues}
                    />
                  </FormGroup>
                </FormFieldRow>
                <MapTextField
                  name="options.defaultCookieNoticeUrl"
                  labelKey="map.cookieLink"
                  synonyms={["cookie", "link"]}
                  placeholder="https://…"
                  register={register}
                  settingsSearchTerm={settingsSearchTerm}
                  searchValues={searchValues}
                />
                <MapTextField
                  name="options.defaultCookieNoticeMessage"
                  labelKey="map.cookieMessage"
                  synonyms={["cookie", "message"]}
                  multiline
                  rows={3}
                  fullWidth
                  register={register}
                  settingsSearchTerm={settingsSearchTerm}
                  searchValues={searchValues}
                />
              </FormFieldGrid>
            </FormPanel>
          </SearchablePanel>

          <SearchablePanel
            panelTitleKeywords={settingsSearchLabels("map.introGuide")}
            keywords={[
              ...settingsSearchLabels(
                "map.introductionEnabled",
                "map.introductionShowControlButton",
                "map.introductionSteps",
              ),
              "intro",
              "guide",
              "onboarding",
            ]}
            fields={[
              "options.introductionEnabled",
              "options.introductionShowControlButton",
              "options.introductionSteps",
            ]}
            allValues={searchValues}
            searchTerm={settingsSearchTerm}
          >
            <FormPanel title={t("map.introGuide")}>
              <FormFieldGrid columns={1}>
                <FormFieldRow>
                  <FormGroup>
                    <MapCheckboxField
                      name="options.introductionEnabled"
                      labelKey="map.introductionEnabled"
                      control={control}
                      settingsSearchTerm={settingsSearchTerm}
                      showSettingsSearchUi={showSettingsSearchUi}
                      getValues={getValues}
                    />
                    <MapCheckboxField
                      name="options.introductionShowControlButton"
                      labelKey="map.introductionShowControlButton"
                      control={control}
                      settingsSearchTerm={settingsSearchTerm}
                      showSettingsSearchUi={showSettingsSearchUi}
                      getValues={getValues}
                    />
                  </FormGroup>
                </FormFieldRow>
                <MapTextField
                  name="options.introductionSteps"
                  labelKey="map.introductionSteps"
                  synonyms={["intro", "guide", "steps"]}
                  multiline
                  rows={8}
                  register={register}
                  settingsSearchTerm={settingsSearchTerm}
                  searchValues={searchValues}
                />
              </FormFieldGrid>
            </FormPanel>
          </SearchablePanel>
        </>
      )}
    </Box>
  );
}
