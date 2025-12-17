import { Grid2 as Grid, Switch } from "@mui/material";
import { TextField, FormControlLabel, Checkbox } from "@mui/material";
import { useForm, Controller, FieldValues } from "react-hook-form";
import FormAccordion from "../../../components/form-components/form-accordion";
import FormPanel from "../../../components/form-components/form-panel";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import { useTranslation } from "react-i18next";
import { SketchPicker } from "react-color";
import AvailableLayersGrid from "../../layers/available-layers-grid";
import { useParams } from "react-router";
import {
  useLayerById,
  // useDeleteLayer,
  // LayerUpdateInput,
  // useUpdateLayer,
  // infoClickFormat,
  // sortType,
  // searchOutputFormat,
  // useServiceByLayerId,
  // useCreateAndUpdateRoleOnLayer,
  // useGetRoleOnLayerByLayerId,
} from "../../../api/layers";

export default function SearchRenderer({
  tool,
}: {
  tool: { [key: string]: any };
}) {
  const { t } = useTranslation();
  const { layerId } = useParams<{ layerId: string }>();
  const { data: layer, isLoading, isError } = useLayerById(layerId ?? "");
  const { control } = useForm<FieldValues>({
    defaultValues: {
      searchInfoText: tool?.options?.searchInfoText ?? "",
      maxHitsPerDataset: tool?.options?.maxHitsPerDataset ?? 1000,
      autoSearchDelay: tool?.options?.autoSearchDelay ?? 500,
      showInfoWhenExceeded: tool?.options?.showInfoWhenExceeded ?? false,
      disableAutocomplete: tool?.options?.disableAutocomplete ?? false,
      disableAutoCombinations: tool?.options?.disableAutoCombinations ?? false,
      wildcardBeforeSearch: tool?.options?.wildcardBeforeSearch ?? false,
      autofocusSearch: tool?.options?.autofocusSearch ?? false,
    },
    mode: "onChange",
  });

  return (
    <>
      <FormPanel title={t("tools.search.generalSettings")}>
        <Grid container>
          {/* Infotext */}
          <Grid size={{ xs: 12 }}>
            <Controller
              name="searchInfoText"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label={t("tools.search.infoText")}
                  placeholder={t("tools.search.infoTextPlaceholder")}
                />
              )}
            />
          </Grid>

          {/* Max hits */}
          <Grid size={{ xs: 12, md: 10 }}>
            <Controller
              name="maxHitsPerDataset"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  type="number"
                  fullWidth
                  label={t("tools.search.maxHitsPerDataset")}
                />
              )}
            />
          </Grid>

          {/* Delay */}
          <Grid size={{ xs: 12, md: 10 }}>
            <Controller
              name="autoSearchDelay"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  type="number"
                  fullWidth
                  label={t("tools.search.autoSearchDelay")}
                />
              )}
            />
          </Grid>

          {/* Checkboxes */}
          <Grid size={{ xs: 12 }}>
            <Controller
              name="showInfoWhenExceeded"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} checked={!!field.value} />}
                  label={t("tools.search.showInfoWhenExceeded")}
                />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Controller
              name="disableAutocomplete"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} checked={!!field.value} />}
                  label={t("tools.search.disableAutocomplete")}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Controller
              name="disableAutoCombinations"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} checked={!!field.value} />}
                  label={t("tools.search.disableAutoCombinations")}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Controller
              name="wildcardBeforeSearch"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} checked={!!field.value} />}
                  label={t("tools.search.wildcardBeforeSearch")}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Controller
              name="autofocusSearch"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} checked={!!field.value} />}
                  label={t("tools.search.autofocusSearch")}
                />
              )}
            />
          </Grid>
        </Grid>
      </FormPanel>

      <FormAccordion title={t("tools.search.spatialSettings")}>
        <Grid container>
          {/* Spatial search checkboxes */}
          <Grid size={{ xs: 12 }}>
            <Controller
              name="enablePolygonSearch"
              control={control}
              defaultValue={tool?.options?.enablePolygonSearch ?? true}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} checked={!!field.value} />}
                  label={t("tools.search.spatial.polygon")}
                />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Controller
              name="enableRadiusSearch"
              control={control}
              defaultValue={tool?.options?.enableRadiusSearch ?? true}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} checked={!!field.value} />}
                  label={t("tools.search.spatial.radius")}
                />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Controller
              name="enableAreaSearch"
              control={control}
              defaultValue={tool?.options?.enableAreaSearch ?? true}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} checked={!!field.value} />}
                  label={t("tools.search.spatial.area")}
                />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Controller
              name="searchWithinView"
              control={control}
              defaultValue={tool?.options?.searchWithinView ?? false}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} checked={!!field.value} />}
                  label={t("tools.search.spatial.withinView")}
                />
              )}
            />
          </Grid>
        </Grid>
        <Grid container columns={12}>
          <Grid size={{ xs: 12, md: "auto" }}>
            <FormControl fullWidth>
              <InputLabel id="strokeColor" shrink>
                {t("tools.strokeColor")}
              </InputLabel>
              <Controller
                name="options.strokeColor"
                control={control}
                render={({ field }) => (
                  <SketchPicker
                    width="220px"
                    color={field.value}
                    onChange={(color) => field.onChange(color.hex)}
                  />
                )}
              />
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: "auto" }}>
            <FormControl fullWidth>
              <InputLabel id="strokeOpacity" shrink>
                {t("tools.strokeOpacity")}
              </InputLabel>
              <Controller
                name="options.strokeOpacity"
                control={control}
                render={({ field }) => (
                  <SketchPicker
                    width="220px"
                    color={field.value}
                    onChange={(color) => field.onChange(color.hex)}
                  />
                )}
              />
            </FormControl>
          </Grid>
        </Grid>
      </FormAccordion>

      <FormAccordion title={t("tools.search.userSettings.title")}>
        <Grid container columns={12} alignItems="center">
          <Grid size={{ xs: 6 }}>
            <Controller
              name="searchVisibleLayers"
              control={control}
              defaultValue={tool?.options?.searchVisibleLayers ?? true}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} checked={!!field.value} />}
                  label={t("tools.search.userSettings.searchVisibleLayers")}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 4 }}>
            <Controller
              name="preSelected"
              control={control}
              defaultValue={tool?.options?.preSelected ?? true}
              render={({ field }) => (
                <FormControlLabel
                  control={<Switch {...field} checked={!!field.value} />}
                  label={t("tools.search.userSettings.preSelected")}
                />
              )}
            />
          </Grid>
        </Grid>

        <Grid container columns={12} alignItems="center">
          <Grid size={{ xs: 6 }}>
            <Controller
              name="wildcardBefore"
              control={control}
              defaultValue={tool?.options?.wildcardBefore ?? true}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} checked={!!field.value} />}
                  label={t("tools.search.userSettings.wildcardBefore")}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 4 }}>
            <Controller
              name="preSelected"
              control={control}
              defaultValue={tool?.options?.preSelected ?? true}
              render={({ field }) => (
                <FormControlLabel
                  control={<Switch {...field} checked={!!field.value} />}
                  label={t("tools.search.userSettings.preSelected")}
                />
              )}
            />
          </Grid>
        </Grid>

        <Grid container columns={12} alignItems="center">
          <Grid size={{ xs: 6 }}>
            <Controller
              name="wildcardAfter"
              control={control}
              defaultValue={tool?.options?.wildcardAfter ?? true}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} checked={!!field.value} />}
                  label={t("tools.search.userSettings.wildcardAfter")}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 4 }}>
            <Controller
              name="preSelected"
              control={control}
              defaultValue={tool?.options?.preSelected ?? true}
              render={({ field }) => (
                <FormControlLabel
                  control={<Switch {...field} checked={!!field.value} />}
                  label={t("tools.search.userSettings.preSelected")}
                />
              )}
            />
          </Grid>
        </Grid>

        <Grid container columns={12} alignItems="center">
          <Grid size={{ xs: 6 }}>
            <Controller
              name="caseSensitive"
              control={control}
              defaultValue={tool?.options?.caseSensitive ?? true}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} checked={!!field.value} />}
                  label={t("tools.search.userSettings.caseSensitive")}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 4 }}>
            <Controller
              name="preSelected"
              control={control}
              defaultValue={tool?.options?.preSelected ?? true}
              render={({ field }) => (
                <FormControlLabel
                  control={<Switch {...field} checked={!!field.value} />}
                  label={t("tools.search.userSettings.preSelected")}
                />
              )}
            />
          </Grid>
        </Grid>

        <Grid container columns={12} alignItems="center">
          <Grid size={{ xs: 6 }}>
            <Controller
              name="requireFullObject"
              control={control}
              defaultValue={tool?.options?.requireFullObject ?? true}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} checked={!!field.value} />}
                  label={t("tools.search.userSettings.requireFullObject")}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 4 }}>
            <Controller
              name="preSelected"
              control={control}
              defaultValue={tool?.options?.preSelected ?? true}
              render={({ field }) => (
                <FormControlLabel
                  control={<Switch {...field} checked={!!field.value} />}
                  label={t("tools.search.userSettings.preSelected")}
                />
              )}
            />
          </Grid>
        </Grid>

        <Grid container columns={12} alignItems="center">
          <Grid size={{ xs: 6 }}>
            <Controller
              name="showResultLabel"
              control={control}
              defaultValue={tool?.options?.showResultLabel ?? true}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} checked={!!field.value} />}
                  label={t("tools.search.userSettings.showResultLabel")}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 4 }}>
            <Controller
              name="preSelected"
              control={control}
              defaultValue={tool?.options?.preSelected ?? true}
              render={({ field }) => (
                <FormControlLabel
                  control={<Switch {...field} checked={!!field.value} />}
                  label={t("tools.search.userSettings.preSelected")}
                />
              )}
            />
          </Grid>
        </Grid>
      </FormAccordion>

      <FormAccordion
        title={t("tools.search.resultDisplayOptions.title", {
          defaultValue: "Alternativ för visning av resultat",
        })}
      >
        <Grid container>
          <Grid size={{ xs: 12 }}>
            <Controller
              name="autoShowAllResultsOnMap"
              control={control}
              defaultValue={tool?.options?.autoShowAllResultsOnMap ?? false}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} checked={!!field.value} />}
                  label={t(
                    "tools.search.resultDisplayOptions.autoShowAllResultsOnMap"
                  )}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Controller
              name="allowResultFiltering"
              control={control}
              defaultValue={tool?.options?.allowResultFiltering ?? false}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} checked={!!field.value} />}
                  label={t(
                    "tools.search.resultDisplayOptions.allowResultFiltering"
                  )}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Controller
              name="allowResultSorting"
              control={control}
              defaultValue={tool?.options?.allowResultSorting ?? false}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} checked={!!field.value} />}
                  label={t(
                    "tools.search.resultDisplayOptions.allowResultSorting"
                  )}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Controller
              name="allowQuickClearSelection"
              control={control}
              defaultValue={tool?.options?.allowQuickClearSelection ?? false}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} checked={!!field.value} />}
                  label={t(
                    "tools.search.resultDisplayOptions.allowQuickClearSelection"
                  )}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Controller
              name="allowDownloadResults"
              control={control}
              defaultValue={tool?.options?.allowDownloadResults ?? false}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} checked={!!field.value} />}
                  label={t(
                    "tools.search.resultDisplayOptions.allowDownloadResults"
                  )}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Controller
              name="showPreviewOnHover"
              control={control}
              defaultValue={tool?.options?.showPreviewOnHover ?? false}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} checked={!!field.value} />}
                  label={t(
                    "tools.search.resultDisplayOptions.showPreviewOnHover"
                  )}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Controller
              name="collectSelectedResults"
              control={control}
              defaultValue={tool?.options?.collectSelectedResults ?? false}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} checked={!!field.value} />}
                  label={t(
                    "tools.search.resultDisplayOptions.collectSelectedResults"
                  )}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Controller
              name="showPrevNextButtons"
              control={control}
              defaultValue={tool?.options?.showPrevNextButtons ?? false}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} checked={!!field.value} />}
                  label={t(
                    "tools.search.resultDisplayOptions.showPrevNextButtons"
                  )}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 10 }}>
            <Controller
              name="maxZoomLevel"
              control={control}
              defaultValue={tool?.options?.maxZoomLevel ?? -1}
              render={({ field }) => (
                <TextField
                  {...field}
                  type="number"
                  fullWidth
                  label={t(
                    "tools.search.resultDisplayOptions.maxZoomLevel",
                    {}
                  )}
                />
              )}
            />
          </Grid>
        </Grid>
      </FormAccordion>

      <FormAccordion title={t("tools.search.hitIconandResultsInMap")}>
        <Grid container>
          {/* Hit icon */}
          <Grid size={{ xs: 12, md: 10 }}>
            <Controller
              name="hitIcon"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  type="text"
                  fullWidth
                  label={t("tools.search.hitIcon")}
                  placeholder={t("tools.search.hitIconPlaceholder")}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 10 }}>
            <Controller
              name="iconDisplacementX"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  type="number"
                  fullWidth
                  label={t("tools.search.iconDisplacementX")}
                  placeholder={t("tools.search.iconDisplacementXPlaceholder")}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 10 }}>
            <Controller
              name="iconDisplacementY"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  type="number"
                  fullWidth
                  label={t("tools.search.iconDisplacementY")}
                  placeholder={t("tools.search.iconDisplacementYPlaceholder")}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 10 }}>
            <Controller
              name="iconScale"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  type="number"
                  fullWidth
                  label={t("tools.search.iconScale")}
                  placeholder={t("tools.search.iconScalePlaceholder")}
                />
              )}
            />
          </Grid>
        </Grid>
      </FormAccordion>

      <FormAccordion title={t("tools.search.standardAppearance")}>
        <Grid container>
          <Grid size={{ xs: 12, md: "auto" }}>
            <FormControl fullWidth>
              <InputLabel id="standardResultsMarkedFillColor" shrink>
                {t("tools.search.standardResultsMarkedFillColor")}
              </InputLabel>
              <Controller
                name="standardResultsMarkedFillColor"
                control={control}
                render={({ field }) => (
                  <SketchPicker
                    width="220px"
                    color={field.value}
                    onChange={(color) => field.onChange(color.hex)}
                  />
                )}
              />
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: "auto" }}>
            <FormControl fullWidth>
              <InputLabel id="standardResultsMarkedFrameColor" shrink>
                {t("tools.search.standardResultsMarkedFrameColor")}
              </InputLabel>
              <Controller
                name="standardResultsMarkedFrameColor"
                control={control}
                render={({ field }) => (
                  <SketchPicker
                    width="220px"
                    color={field.value}
                    onChange={(color) => field.onChange(color.hex)}
                  />
                )}
              />
            </FormControl>
          </Grid>
        </Grid>
      </FormAccordion>

      <FormAccordion title={t("tools.search.markedResultsAppearance")}>
        <Grid container>
          <Grid size={{ xs: 12, md: "auto" }}>
            <FormControl fullWidth>
              <InputLabel id="markedResultsTextFillColor" shrink>
                {t("tools.search.markedResultsTextFillColor")}
              </InputLabel>
              <Controller
                name="markedResultsTextFillColor"
                control={control}
                render={({ field }) => (
                  <SketchPicker
                    width="220px"
                    color={field.value}
                    onChange={(color) => field.onChange(color.hex)}
                  />
                )}
              />
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: "auto" }}>
            <FormControl fullWidth>
              <InputLabel id="markedResultsTextFrameColor" shrink>
                {t("tools.search.markedResultsTextFrameColor")}
              </InputLabel>
              <Controller
                name="markedResultsTextFrameColor"
                control={control}
                render={({ field }) => (
                  <SketchPicker
                    width="220px"
                    color={field.value}
                    onChange={(color) => field.onChange(color.hex)}
                  />
                )}
              />
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: "auto" }}>
            <FormControl fullWidth>
              <InputLabel id="markedResultsMarkedFillColor" shrink>
                {t("tools.search.markedResultsMarkedFillColor")}
              </InputLabel>
              <Controller
                name="markedResultsMarkedFillColor"
                control={control}
                render={({ field }) => (
                  <SketchPicker
                    width="220px"
                    color={field.value}
                    onChange={(color) => field.onChange(color.hex)}
                  />
                )}
              />
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: "auto" }}>
            <FormControl fullWidth>
              <InputLabel id="markedResultsMarkedFrameColor" shrink>
                {t("tools.search.markedResultsMarkedFrameColor")}
              </InputLabel>
              <Controller
                name="markedResultsMarkedFrameColor"
                control={control}
                render={({ field }) => (
                  <SketchPicker
                    width="220px"
                    color={field.value}
                    onChange={(color) => field.onChange(color.hex)}
                  />
                )}
              />
            </FormControl>
          </Grid>
        </Grid>
      </FormAccordion>
      {/* Utseende för det aktiva ("highlightade") resultatet */}
      <FormAccordion title={t("tools.search.activeResultAppearance")}>
        <Grid container>
          <Grid size={{ xs: 12, md: "auto" }}>
            <FormControl fullWidth>
              <InputLabel id="activeResultTextFillColor" shrink>
                {t("tools.search.activeResultTextFillColor")}
              </InputLabel>
              <Controller
                name="activeResultTextFillColor"
                control={control}
                render={({ field }) => (
                  <SketchPicker
                    width="220px"
                    color={field.value}
                    onChange={(color) => field.onChange(color.hex)}
                  />
                )}
              />
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: "auto" }}>
            <FormControl fullWidth>
              <InputLabel id="activeResultTextFrameColor" shrink>
                {t("tools.search.activeResultTextFrameColor")}
              </InputLabel>
              <Controller
                name="activeResultTextFrameColor"
                control={control}
                render={({ field }) => (
                  <SketchPicker
                    width="220px"
                    color={field.value}
                    onChange={(color) => field.onChange(color.hex)}
                  />
                )}
              />
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: "auto" }}>
            <FormControl fullWidth>
              <InputLabel id="activeResultMarkedFillColor" shrink>
                {t("tools.search.activeResultMarkedFillColor")}
              </InputLabel>
              <Controller
                name="activeResultMarkedFillColor"
                control={control}
                render={({ field }) => (
                  <SketchPicker
                    width="220px"
                    color={field.value}
                    onChange={(color) => field.onChange(color.hex)}
                  />
                )}
              />
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: "auto" }}>
            <FormControl fullWidth>
              <InputLabel id="activeResultMarkedFrameColor" shrink>
                {t("tools.search.activeResultMarkedFrameColor")}
              </InputLabel>
              <Controller
                name="activeResultMarkedFrameColor"
                control={control}
                render={({ field }) => (
                  <SketchPicker
                    width="220px"
                    color={field.value}
                    onChange={(color) => field.onChange(color.hex)}
                  />
                )}
              />
            </FormControl>
          </Grid>
        </Grid>
      </FormAccordion>
      {/* <FormPanel title={t("tools.search.availableLayers")}>
        {layer && (
          <AvailableLayersGrid
            isLoading={serviceLoading}
            getCapLayers={getCapLayers}
            selectedLayers={layer?.selectedLayers ?? []}
            filteredLayers={filteredLayers}
            setSearchTerm={setSearchTerm}
            setSelectGridId={setSelectGridId}
            searchTerm={searchTerm}
            selectGridId={selectGridId}
            selectedRowObjects={selectedRowObjects}
          />
        )}{" "}
      </FormPanel> */}
    </>
  );
}
