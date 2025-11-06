import { useState, useRef, useMemo } from "react";
import { useParams } from "react-router";
import Page from "../../layouts/root/components/page";
import { useTranslation } from "react-i18next";
import {
  Grid2 as Grid,
  TextField,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormGroup,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { GridRowSelectionModel } from "@mui/x-data-grid";
import { Controller, FieldValues, useForm } from "react-hook-form";
import UsedInMapsGrid from "./used-in-maps-grid";
import {
  useLayerById,
  //useDeleteLayer,
  LayerUpdateInput,
  useUpdateLayer,
  infoClickFormat,
  sortType,
  searchOutputFormat,
  useServiceByLayerId,
  useCreateAndUpdateRoleOnLayer,
  useGetRoleOnLayerByLayerId,
} from "../../api/layers";
import { SquareSpinnerComponent } from "../../components/progress/square-progress";
import FormActionPanel from "../../components/form-action-panel";
import { toast } from "react-toastify";
import {
  useServices,
  useServiceCapabilities,
  SERVICE_TYPE,
} from "../../api/services";
import AvailableLayersGrid from "./available-layers-grid";
import { useRoles } from "../../api/users";
import { HttpError } from "../../lib/http-error";
import FormContainer from "../../components/form-components/form-container";
import FormPanel from "../../components/form-components/form-panel";
import FormAccordion from "../../components/form-components/form-accordion";

export default function LayerSettings() {
  const { t } = useTranslation();
  const { layerId } = useParams<{ layerId: string }>();
  const { data: layer, isLoading, isError } = useLayerById(layerId ?? "");
  const { mutateAsync: updateLayer, status: updateStatus } = useUpdateLayer();
  const { mutateAsync: createRoleOnLayer } = useCreateAndUpdateRoleOnLayer();
  const { palette } = useTheme();
  const { data: services } = useServices();
  const { data: roles } = useRoles();
  const { data: roleOnLayer } = useGetRoleOnLayerByLayerId(layerId ?? "");

  const formRef = useRef<HTMLFormElement | null>(null);
  const { data: service, isLoading: serviceLoading } = useServiceByLayerId(
    layer?.id ?? "",
    !!layer?.id
  );
  //const { mutateAsync: deleteLayer, status: deleteStatus } = useDeleteLayer(
  // service?.id ?? ""
  //);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectGridId, setSelectGridId] = useState<GridRowSelectionModel>();
  const { layers: getCapLayers, styles: getCapStyles } = useServiceCapabilities(
    {
      baseUrl: service?.url ?? "",
      type:
        service?.type === SERVICE_TYPE.WMS
          ? SERVICE_TYPE.WMS
          : service?.type === SERVICE_TYPE.WMTS
          ? SERVICE_TYPE.WMS
          : service?.type === SERVICE_TYPE.WFS
          ? SERVICE_TYPE.WFS
          : service?.type === SERVICE_TYPE.WFST
          ? SERVICE_TYPE.WFS
          : service?.type === SERVICE_TYPE.VECTOR
          ? SERVICE_TYPE.WFS
          : service?.type,
    }
  );

  const styles = layer?.selectedLayers.flatMap(
    (key) => getCapStyles[key] || []
  );
  const handleExternalSubmit = () => {
    if (formRef.current) {
      formRef.current.requestSubmit();
    }
  };

  const defaultValues = {} as FieldValues;
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<FieldValues>({
    defaultValues,
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const watchRoleIdInput = watch("roleId") as string | undefined;

  const filteredLayers = useMemo(() => {
    if (!getCapLayers) return [];

    const searchAndSelectedFilteredLayers = getCapLayers
      .map((layer, index) => {
        const isSelected = selectGridId?.includes(index);
        return {
          id: index,
          layer,
          infoClick: "",
          publications: "",
          selected: isSelected,
        };
      })
      .filter(
        (layer) =>
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          layer?.selected || // Disable lint here since ?? is messing with the data-grid search logic
          layer.layer.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        const aMatches = a.layer
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        const bMatches = b.layer
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

        if (aMatches && !bMatches) return -1;
        if (!aMatches && bMatches) return 1;
        return 0;
      });
    return searchAndSelectedFilteredLayers;
  }, [getCapLayers, searchTerm, selectGridId]);

  const selectedRowsData = useMemo(
    () =>
      selectGridId?.map((id) => filteredLayers.find((row) => row.id === id)),
    [selectGridId, filteredLayers]
  );

  const selectedRowObjects = useMemo(
    () => selectedRowsData?.map((row) => row?.layer ?? ""),
    [selectedRowsData]
  );

  const handleUpdateLayer = async (layerData: LayerUpdateInput) => {
    try {
      const payload = {
        name: layerData.name,
        serviceId: layerData.serviceId,
        selectedLayers: layerData.selectedLayers,
        internalName: layerData.internalName,
        description: layerData.description,
        hidpi: layerData.hidpi,
        singleTile: layerData.singleTile,
        customRatio: layerData.customRatio,
        style: layerData.style,
        opacity: layerData.opacity,
        minMaxZoomAlertOnToggleOnly: layerData.minMaxZoomAlertOnToggleOnly,
        minZoom: layerData.minZoom,
        maxZoom: layerData.maxZoom,
        infoClickActive: layerData?.infoClickActive,
        showMetadata: layerData?.showMetadata,
        legendUrl: layerData?.legendUrl,
        legendIconUrl: layerData?.legendIconUrl,
        legendOptions: layerData?.legendOptions,
        options: {
          keyword: layerData?.options?.keyword,
          category: layerData?.options?.category,
          geoWebCache: layerData?.options?.geoWebCache,
          showAttributeTableButton:
            layerData?.options?.showAttributeTableButton,
          layerDisplayDescription: layerData?.options?.layerDisplayDescription,
        },
        metadata: {
          title: layerData?.metadata?.title,
          url: layerData?.metadata?.url,
          urlTitle: layerData?.metadata?.urlTitle,
          attribution: layerData?.metadata?.attribution,
        },
        searchSettings: {
          active: layerData?.searchSettings?.active,
          url: layerData?.searchSettings?.url,
          searchFields: layerData?.searchSettings?.searchFields,
          outputFormat: layerData?.searchSettings?.outputFormat,
          geometryField: layerData?.searchSettings?.geometryField,
          primaryDisplayFields: layerData?.searchSettings?.primaryDisplayFields,
          secondaryDisplayFields:
            layerData?.searchSettings?.secondaryDisplayFields,
          shortDisplayFields: layerData?.searchSettings?.shortDisplayFields,
        },
        infoClickSettings: {
          sortDescending: layerData?.infoClickSettings?.sortDescending,
          definition: layerData?.infoClickSettings?.definition,
          icon: layerData?.infoClickSettings?.icon,
          sortProperty: layerData?.infoClickSettings?.sortProperty,
          format: layerData?.infoClickSettings?.format,
          sortMethod: layerData?.infoClickSettings?.sortMethod,
        },
      };

      await updateLayer({
        layerId: layer?.id ?? "",
        data: payload,
      });
      toast.success(t("layers.updateLayerSuccess", { name: layerData.name }), {
        position: "bottom-left",
        theme: palette.mode,
        hideProgressBar: true,
      });

      if (watchRoleIdInput) {
        await createRoleOnLayer({
          layerId: layer?.id ?? "",
          roleId: watchRoleIdInput,
        });
      }
    } catch (error) {
      console.error("Failed to update layer:", error);
      toast.error(t("layers.updateLayerFailed", { name: layer?.name }), {
        position: "bottom-left",
        theme: palette.mode,
        hideProgressBar: true,
      });
    }
  };
  // TODO?: Add delete layer
  /*
  const handleDeleteLayer = async () => {
    if (!isLoading && layer?.id) {
      try {
        await deleteLayer(layer.id ?? "");
        toast.success(t("layers.deleteLayerSuccess", { name: layer?.name }), {
          position: "bottom-left",
          theme: palette.mode,
          hideProgressBar: true,
        });
      } catch (error) {
        console.log(error);
        toast.error(t("layers.deleteLayerFailed", { name: layer?.name }), {
          position: "bottom-left",
          theme: palette.mode,
          hideProgressBar: true,
        });
      }
    } else {
      console.log("Layer data is still loading or unavailable.");
    }
  };
  */
  // removed createOnSubmitHandler; handled inline in FormContainer onSubmit

  if (isLoading) {
    return <SquareSpinnerComponent />;
  }
  if (!layer) {
    throw new HttpError(404, "Layer not found");
  }
  if (isError) return <div>Error fetching layer details.</div>;
  return (
    <Page title={t("common.settings")}>
      <FormActionPanel
        updateStatus={updateStatus}
        onUpdate={handleExternalSubmit}
        saveButtonText="Spara"
        createdBy={layer?.createdBy}
        createdDate={layer?.createdDate}
        lastSavedBy={layer?.lastSavedBy}
        lastSavedDate={layer?.lastSavedDate}
      >
        <FormContainer
          onSubmit={(e) => {
            e.preventDefault();
            void handleSubmit((data: FieldValues) => {
              const toNumber = (v: unknown) =>
                typeof v === "string" && v.trim() !== ""
                  ? Number(v)
                  : (v as number | undefined);
              const toArray = (v: unknown) =>
                Array.isArray(v)
                  ? (v as string[])
                  : typeof v === "string"
                  ? v
                      .split(",")
                      .map((s) => s.trim())
                      .filter((s) => s.length > 0)
                  : undefined;

              const normalized: LayerUpdateInput = {
                name: data.name as string | undefined,
                serviceId: data.serviceId as string | undefined,
                internalName: data.internalName as string | undefined,
                description: data.description as string | undefined,
                opacity: toNumber(data.opacity),
                minZoom: toNumber(data.minZoom),
                maxZoom: toNumber(data.maxZoom),
                minMaxZoomAlertOnToggleOnly:
                  data.minMaxZoomAlertOnToggleOnly as boolean | undefined,
                singleTile: data.singleTile as boolean | undefined,
                hidpi: data.hidpi as boolean | undefined,
                customRatio: toNumber(data.customRatio),
                showMetadata: data.showMetadata as boolean | undefined,
                infoClickActive: data.infoClickActive as boolean | undefined,
                style: data.style as string | undefined,
                metadata: {
                  title: data["metadata.title"] as string | undefined,
                  url: data["metadata.url"] as string | undefined,
                  urlTitle: data["metadata.urlTitle"] as string | undefined,
                  attribution: data["metadata.attribution"] as
                    | string
                    | undefined,
                },
                searchSettings: {
                  active: data["searchSettings.active"] as boolean | undefined,
                  url: data["searchSettings.url"] as string | undefined,
                  searchFields: toArray(
                    data["searchSettings.searchFields"] as unknown
                  ),
                  primaryDisplayFields: toArray(
                    data["searchSettings.primaryDisplayFields"] as unknown
                  ),
                  secondaryDisplayFields: toArray(
                    data["searchSettings.secondaryDisplayFields"] as unknown
                  ),
                  shortDisplayFields: toArray(
                    data["searchSettings.shortDisplayFields"] as unknown
                  ),
                  geometryField: data["searchSettings.geometryField"] as
                    | string
                    | undefined,
                  outputFormat: data["searchSettings.outputFormat"] as
                    | string
                    | undefined,
                },
                infoClickSettings: {
                  definition: data["infoClickSettings.definition"] as
                    | string
                    | undefined,
                  icon: data["infoClickSettings.icon"] as string | undefined,
                  format: data["infoClickSettings.format"] as
                    | string
                    | undefined,
                  sortProperty: data["infoClickSettings.sortProperty"] as
                    | string
                    | undefined,
                  sortMethod: data["infoClickSettings.sortMethod"] as
                    | string
                    | undefined,
                },
                options: {
                  keyword: data["options.keyword"] as string | undefined,
                  category: data["options.category"] as string | undefined,
                  layerDisplayDescription: data[
                    "options.layerDisplayDescription"
                  ] as string | undefined,
                } as Record<string, unknown>,
                selectedLayers: selectedRowObjects,
              };

              void handleUpdateLayer(normalized);
            })(e);
          }}
          formRef={formRef}
          noValidate={false}
        >
          <FormPanel title={t("common.information")}>
            <Grid container>
              <Grid size={12}>
                <TextField
                  label={t("common.name")}
                  fullWidth
                  defaultValue={layer?.name}
                  {...register("name", {
                    required: `${t("common.required")}`,
                  })}
                  error={!!errors.name}
                  helperText={
                    (errors.name as unknown as { message?: string })?.message
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel id="serviceId-label">
                    {t("layers.common.service")}
                  </InputLabel>
                  <Controller
                    name="serviceId"
                    control={control}
                    defaultValue={layer?.serviceId}
                    rules={{ required: `${t("common.required")}` }}
                    render={({ field }) => (
                      <Select
                        labelId="serviceId-label"
                        label={t("layers.common.service")}
                        {...field}
                      >
                        {(services ?? []).map((service) => (
                          <MenuItem key={service.id} value={service.id}>
                            {service.name}({service.type})
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label={t("layers.internalName")}
                  fullWidth
                  defaultValue={layer?.internalName}
                  {...register("internalName")}
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  label={t("layers.copyRight")}
                  fullWidth
                  defaultValue={layer?.metadata?.attribution}
                  {...register("metadata.attribution")}
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  label={t("map.description")}
                  fullWidth
                  multiline
                  rows={3}
                  defaultValue={layer?.description}
                  {...register("description")}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label={t("layers.keyword")}
                  fullWidth
                  defaultValue={layer?.options?.keyword}
                  {...register("options.keyword")}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label={t("layers.category")}
                  fullWidth
                  defaultValue={layer?.options?.category}
                  {...register("options.category")}
                />
              </Grid>
            </Grid>
          </FormPanel>

          <FormAccordion title={t("services.settings.request")}>
            <Grid container>
              <Grid size={12}>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Checkbox
                        defaultChecked={layer?.hidpi}
                        {...register("hidpi")}
                      />
                    }
                    label={t("layers.hidpi")}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        defaultChecked={layer?.singleTile}
                        {...register("singleTile")}
                      />
                    }
                    label="Single tile"
                  />
                </FormGroup>
              </Grid>
            </Grid>
          </FormAccordion>

          <FormAccordion title={t("layers.settings")}>
            <Grid container spacing={2}>
              <Grid size={12}>
                <FormControl fullWidth>
                  <InputLabel id="style-label">{t("layers.style")}</InputLabel>
                  <Controller
                    name="style"
                    control={control}
                    defaultValue={layer?.style ?? ""}
                    render={({ field }) => (
                      <Select
                        labelId="style-label"
                        label={t("layers.style")}
                        {...field}
                      >
                        <MenuItem value="">{"<default>"}</MenuItem>
                        {(styles ?? []).map((s) => (
                          <MenuItem key={s.name} value={s.name}>
                            {s.name}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label={t("layers.opacity")}
                  fullWidth
                  type="number"
                  defaultValue={layer?.opacity}
                  {...register("opacity")}
                />
              </Grid>
            </Grid>
          </FormAccordion>

          <FormAccordion title={t("layers.settings.displayFields")}>
            <Grid container>
              <Grid size={12}>
                <TextField
                  label={t("layers.primaryDisplayFields")}
                  fullWidth
                  defaultValue={(
                    layer?.searchSettings?.primaryDisplayFields ?? []
                  ).join(", ")}
                  {...register("searchSettings.primaryDisplayFields")}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label={t("layers.secondaryDisplayFields")}
                  fullWidth
                  defaultValue={(
                    layer?.searchSettings?.secondaryDisplayFields ?? []
                  ).join(", ")}
                  {...register("searchSettings.secondaryDisplayFields")}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label={t("layers.shortDisplayFields")}
                  fullWidth
                  defaultValue={(
                    layer?.searchSettings?.shortDisplayFields ?? []
                  ).join(", ")}
                  {...register("searchSettings.shortDisplayFields")}
                />
              </Grid>
            </Grid>
          </FormAccordion>

          <FormAccordion title={t("common.infoclick")}>
            <Grid container>
              <Grid size={12}>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Checkbox
                        defaultChecked={layer?.infoClickActive}
                        {...register("infoClickActive")}
                      />
                    }
                    label={t("common.infoclick")}
                  />
                </FormGroup>
              </Grid>
              <Grid size={12}>
                <TextField
                  label={t("layers.infobox")}
                  fullWidth
                  multiline
                  rows={3}
                  defaultValue={layer?.infoClickSettings?.definition}
                  {...register("infoClickSettings.definition")}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label={t("layers.infoClickIcon")}
                  fullWidth
                  defaultValue={layer?.infoClickSettings?.icon}
                  {...register("infoClickSettings.icon")}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label={t("layers.sortByAttribute")}
                  fullWidth
                  defaultValue={layer?.infoClickSettings?.sortProperty}
                  {...register("infoClickSettings.sortProperty")}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel id="format-label">
                    {t("layers.infoClickFormat")}
                  </InputLabel>
                  <Controller
                    name="infoClickSettings.format"
                    control={control}
                    defaultValue={layer?.infoClickSettings?.format}
                    render={({ field }) => (
                      <Select
                        labelId="format-label"
                        label={t("layers.infoClickFormat")}
                        {...field}
                      >
                        {infoClickFormat.map((format) => (
                          <MenuItem key={format.value} value={format.value}>
                            {format.title}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel id="sortMethod-label">
                    {t("layers.infoClickSortMethod")}
                  </InputLabel>
                  <Controller
                    name="infoClickSettings.sortMethod"
                    control={control}
                    defaultValue={layer?.infoClickSettings?.sortMethod}
                    render={({ field }) => (
                      <Select
                        labelId="sortMethod-label"
                        label={t("layers.infoClickSortMethod")}
                        {...field}
                      >
                        {sortType.map((type) => (
                          <MenuItem key={type.value} value={type.value}>
                            {type.title}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                </FormControl>
              </Grid>
            </Grid>
          </FormAccordion>

          <FormAccordion title={t("layers.settings.searchSettings")}>
            <Grid container>
              <Grid size={12}>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Checkbox
                        defaultChecked={layer?.searchSettings?.active}
                        {...register("searchSettings.active")}
                      />
                    }
                    label={t("layers.searchSettings.active")}
                  />
                </FormGroup>
              </Grid>
              <Grid size={12}>
                <TextField
                  label="Url"
                  fullWidth
                  defaultValue={layer?.searchSettings?.url}
                  {...register("searchSettings.url")}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel id="outputFormat-label">
                    {t("layers.searchSettings.outputFormat")}
                  </InputLabel>
                  <Controller
                    name="searchSettings.outputFormat"
                    control={control}
                    defaultValue={layer?.searchSettings?.outputFormat}
                    render={({ field }) => (
                      <Select
                        labelId="outputFormat-label"
                        label={t("layers.searchSettings.outputFormat")}
                        {...field}
                      >
                        {searchOutputFormat.map((format) => (
                          <MenuItem key={format} value={format}>
                            {format}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label={t("layers.searchSettings.geometryField")}
                  fullWidth
                  defaultValue={layer?.searchSettings?.geometryField}
                  {...register("searchSettings.geometryField")}
                />
              </Grid>
            </Grid>
          </FormAccordion>

          <FormAccordion title={t("common.infobutton")}>
            <Grid container>
              <Grid size={12}>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Checkbox
                        defaultChecked={layer?.showMetadata}
                        {...register("showMetadata")}
                      />
                    }
                    label={t("layers.showMetadata")}
                  />
                </FormGroup>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label={t("layers.metadata.title")}
                  fullWidth
                  defaultValue={layer?.metadata?.title}
                  {...register("metadata.title")}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label={t("layers.metadata.urlTitle")}
                  fullWidth
                  defaultValue={layer?.metadata?.urlTitle}
                  {...register("metadata.urlTitle")}
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  label="Url"
                  fullWidth
                  defaultValue={layer?.metadata?.url}
                  {...register("metadata.url")}
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  label={t("layers.layerDisplayDescription")}
                  fullWidth
                  multiline
                  rows={3}
                  defaultValue={layer?.options?.layerDisplayDescription}
                  {...register("options.layerDisplayDescription")}
                />
              </Grid>
            </Grid>
          </FormAccordion>

          <FormAccordion title={t("layers.permissions")}>
            <FormControl fullWidth>
              <InputLabel id="roleId-label">
                {t("layers.permission")}
              </InputLabel>
              <Controller
                name="roleId"
                control={control}
                defaultValue={roleOnLayer?.roleId}
                render={({ field }) => (
                  <Select
                    labelId="roleId-label"
                    label={t("layers.permission")}
                    {...field}
                  >
                    {(roles ?? []).map((role) => (
                      <MenuItem key={role.id} value={role.id}>
                        {role.title}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
            </FormControl>
          </FormAccordion>

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
          )}
          <UsedInMapsGrid />
        </FormContainer>
      </FormActionPanel>
    </Page>
  );
}
