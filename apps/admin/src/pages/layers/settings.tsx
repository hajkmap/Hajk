import { useState, useRef, useMemo, useEffect } from "react";
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
  Button,
  IconButton,
  Box,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
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
  const [useCustomDpiList, setUseCustomDpiList] = useState<boolean>(false);
  const [customDpiList, setCustomDpiList] = useState<
    { pxRatio: number; dpi: number }[]
  >([
    { pxRatio: 0, dpi: 90 },
    { pxRatio: 2, dpi: 180 },
  ]);
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

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<FieldValues>({
    mode: "onChange",
    reValidateMode: "onChange",
  });

  // Reset form with layer data when it loads
  useEffect(() => {
    if (layer) {
      reset({
        name: layer.name ?? "",
        serviceId: layer.serviceId ?? "",
        internalName: layer.internalName ?? "",
        description: layer.description ?? "",
        hidpi: layer.hidpi ?? false,
        singleTile: layer.singleTile ?? false,
        customRatio: layer.customRatio,
        style: layer.style ?? "",
        opacity: layer.opacity,
        minZoom: layer.minZoom,
        maxZoom: layer.maxZoom,
        minMaxZoomAlertOnToggleOnly: layer.minMaxZoomAlertOnToggleOnly ?? false,
        infoClickActive: layer.infoClickActive ?? false,
        showMetadata: layer.showMetadata ?? false,
        legendUrl: layer.legendUrl ?? "",
        legendIconUrl: layer.legendIconUrl ?? "",
        legendOptions: layer.legendOptions ?? "",
        useCustomDpiList: false,
        roleId: roleOnLayer?.roleId ?? "",
        metadata: {
          title: layer.metadata?.title ?? "",
          url: layer.metadata?.url ?? "",
          urlTitle: layer.metadata?.urlTitle ?? "",
          attribution: layer.metadata?.attribution ?? "",
        },
        searchSettings: {
          active: layer.searchSettings?.active ?? false,
          url: layer.searchSettings?.url ?? "",
          searchFields: (layer.searchSettings?.searchFields ?? []).join(", "),
          primaryDisplayFields: (
            layer.searchSettings?.primaryDisplayFields ?? []
          ).join(", "),
          secondaryDisplayFields: (
            layer.searchSettings?.secondaryDisplayFields ?? []
          ).join(", "),
          shortDisplayFields: (
            layer.searchSettings?.shortDisplayFields ?? []
          ).join(", "),
          geometryField: layer.searchSettings?.geometryField ?? "",
          outputFormat: layer.searchSettings?.outputFormat ?? "",
        },
        infoClickSettings: {
          definition: layer.infoClickSettings?.definition ?? "",
          icon: layer.infoClickSettings?.icon ?? "",
          format: layer.infoClickSettings?.format ?? "",
          sortProperty: layer.infoClickSettings?.sortProperty ?? "",
          sortMethod: layer.infoClickSettings?.sortMethod ?? "",
          sortDescending: layer.infoClickSettings?.sortDescending ?? false,
        },
        options: {
          keyword: layer.options?.keyword ?? "",
          category: layer.options?.category ?? "",
          layerDisplayDescription: layer.options?.layerDisplayDescription ?? "",
          geoWebCache: layer.options?.geoWebCache ?? false,
          showAttributeTableButton:
            layer.options?.showAttributeTableButton ?? false,
        },
      });
    }
  }, [layer, roleOnLayer, reset]);

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

  const handleUpdateDpiList = (
    index: number,
    key: "pxRatio" | "dpi",
    value: string
  ) => {
    if (value.includes(".") || value.includes(",")) {
      return; // Don't allow decimals
    }
    const numValue = parseInt(value, 10) || 0;
    const newList = [...customDpiList];
    newList[index] = { ...newList[index], [key]: numValue };
    setCustomDpiList(newList);
  };

  const handleRemoveDpiListRow = (index: number) => {
    if (customDpiList.length <= 1) {
      return; // Keep at least one row
    }
    const newList = [...customDpiList];
    newList.splice(index, 1);
    setCustomDpiList(newList);
  };

  const handleAddDpiListRow = () => {
    setCustomDpiList([...customDpiList, { pxRatio: 0, dpi: 90 }]);
  };

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
        isDirty={isDirty}
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
                  title: (data.metadata as { title?: string })?.title,
                  url: (data.metadata as { url?: string })?.url,
                  urlTitle: (data.metadata as { urlTitle?: string })?.urlTitle,
                  attribution: (data.metadata as { attribution?: string })
                    ?.attribution,
                },
                searchSettings: {
                  active: (data.searchSettings as { active?: boolean })?.active,
                  url: (data.searchSettings as { url?: string })?.url,
                  searchFields: toArray(
                    (data.searchSettings as { searchFields?: unknown })
                      ?.searchFields
                  ),
                  primaryDisplayFields: toArray(
                    (data.searchSettings as { primaryDisplayFields?: unknown })
                      ?.primaryDisplayFields
                  ),
                  secondaryDisplayFields: toArray(
                    (
                      data.searchSettings as {
                        secondaryDisplayFields?: unknown;
                      }
                    )?.secondaryDisplayFields
                  ),
                  shortDisplayFields: toArray(
                    (data.searchSettings as { shortDisplayFields?: unknown })
                      ?.shortDisplayFields
                  ),
                  geometryField: (
                    data.searchSettings as { geometryField?: string }
                  )?.geometryField,
                  outputFormat: (
                    data.searchSettings as { outputFormat?: string }
                  )?.outputFormat,
                },
                infoClickSettings: {
                  definition: (
                    data.infoClickSettings as { definition?: string }
                  )?.definition,
                  icon: (data.infoClickSettings as { icon?: string })?.icon,
                  format: (data.infoClickSettings as { format?: string })
                    ?.format,
                  sortProperty: (
                    data.infoClickSettings as { sortProperty?: string }
                  )?.sortProperty,
                  sortMethod: (
                    data.infoClickSettings as { sortMethod?: string }
                  )?.sortMethod,
                },
                options: {
                  keyword: (data.options as { keyword?: string })?.keyword,
                  category: (data.options as { category?: string })?.category,
                  layerDisplayDescription: (
                    data.options as { layerDisplayDescription?: string }
                  )?.layerDisplayDescription,
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
                  {...register("name", {
                    required: `${t("common.required")}`,
                  })}
                  error={!!errors.name}
                  helperText={
                    (errors.name as unknown as { message?: string })?.message
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, md: 10 }}>
                <FormControl fullWidth>
                  <InputLabel id="serviceId-label">
                    {t("layers.common.service")}
                  </InputLabel>
                  <Controller
                    name="serviceId"
                    control={control}
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
              <Grid size={{ xs: 12, md: 10 }}>
                <TextField
                  label={t("layers.internalName")}
                  fullWidth
                  {...register("internalName")}
                />
              </Grid>
              <Grid size={10}>
                <TextField
                  label={t("layers.copyRight")}
                  fullWidth
                  {...register("metadata.attribution")}
                />
              </Grid>
              <Grid size={10}>
                <TextField
                  label={t("map.description")}
                  fullWidth
                  multiline
                  rows={3}
                  {...register("description")}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 10 }}>
                <TextField
                  label={t("layers.keyword")}
                  fullWidth
                  {...register("options.keyword")}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 10 }}>
                <TextField
                  label={t("layers.category")}
                  fullWidth
                  {...register("options.category")}
                />
              </Grid>
            </Grid>
          </FormPanel>

          <FormAccordion title={t("services.settings.request")}>
            <Grid container>
              <Grid size={12}>
                <FormGroup>
                  <Controller
                    name="hidpi"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={Boolean(field.value)}
                            onChange={(e) => field.onChange(e.target.checked)}
                          />
                        }
                        label={t("layers.hidpi")}
                      />
                    )}
                  />
                  <Controller
                    name="singleTile"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={Boolean(field.value)}
                            onChange={(e) => field.onChange(e.target.checked)}
                          />
                        }
                        label="Single tile"
                      />
                    )}
                  />
                </FormGroup>
              </Grid>
            </Grid>
          </FormAccordion>

          <FormAccordion title={t("layers.customDpi")}>
            <Grid container>
              <Grid size={12}>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Controller
                        name="useCustomDpiList"
                        control={control}
                        render={({ field }) => (
                          <Checkbox
                            {...field}
                            checked={Boolean(field.value)}
                            onChange={(e) => {
                              field.onChange(e.target.checked);
                              setUseCustomDpiList(e.target.checked);
                            }}
                          />
                        )}
                      />
                    }
                    label={t("layers.useCustomDpiList")}
                  />
                </FormGroup>
              </Grid>
              {useCustomDpiList && (
                <Grid container>
                  {customDpiList.map((item, index) => (
                    <Grid size={12} key={index}>
                      <Box display="flex" alignItems="center" gap={2}>
                        <TextField
                          label={t("layers.pxRatio")}
                          type="number"
                          value={item.pxRatio}
                          onChange={(e) =>
                            handleUpdateDpiList(
                              index,
                              "pxRatio",
                              e.target.value
                            )
                          }
                          sx={{ width: 150 }}
                        />
                        <TextField
                          label={t("layers.dpi")}
                          type="number"
                          value={item.dpi}
                          onChange={(e) =>
                            handleUpdateDpiList(index, "dpi", e.target.value)
                          }
                          sx={{ width: 150 }}
                        />
                        <IconButton
                          onClick={() => handleRemoveDpiListRow(index)}
                          disabled={customDpiList.length <= 1}
                          color="error"
                          aria-label={t("common.delete")}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Grid>
                  ))}
                  <Grid size={12}>
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={handleAddDpiListRow}
                    >
                      {t("layers.addDpiRow")}
                    </Button>
                  </Grid>
                </Grid>
              )}
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
                  {...register("searchSettings.primaryDisplayFields")}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label={t("layers.secondaryDisplayFields")}
                  fullWidth
                  {...register("searchSettings.secondaryDisplayFields")}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label={t("layers.shortDisplayFields")}
                  fullWidth
                  {...register("searchSettings.shortDisplayFields")}
                />
              </Grid>
            </Grid>
          </FormAccordion>

          <FormAccordion title={t("common.infoclick")}>
            <Grid container>
              <Grid size={12}>
                <FormGroup>
                  <Controller
                    name="infoClickActive"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={Boolean(field.value)}
                            onChange={(e) => field.onChange(e.target.checked)}
                          />
                        }
                        label={t("common.infoclick")}
                      />
                    )}
                  />
                </FormGroup>
              </Grid>
              <Grid size={12}>
                <TextField
                  label={t("layers.infobox")}
                  fullWidth
                  multiline
                  rows={3}
                  {...register("infoClickSettings.definition")}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label={t("layers.infoClickIcon")}
                  fullWidth
                  {...register("infoClickSettings.icon")}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label={t("layers.sortByAttribute")}
                  fullWidth
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
                  <Controller
                    name="searchSettings.active"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={Boolean(field.value)}
                            onChange={(e) => field.onChange(e.target.checked)}
                          />
                        }
                        label={t("layers.searchSettings.active")}
                      />
                    )}
                  />
                </FormGroup>
              </Grid>
              <Grid size={12}>
                <TextField
                  label="Url"
                  fullWidth
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
                  {...register("searchSettings.geometryField")}
                />
              </Grid>
            </Grid>
          </FormAccordion>

          <FormAccordion title={t("common.infobutton")}>
            <Grid container>
              <Grid size={12}>
                <FormGroup>
                  <Controller
                    name="showMetadata"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={Boolean(field.value)}
                            onChange={(e) => field.onChange(e.target.checked)}
                          />
                        }
                        label={t("layers.showMetadata")}
                      />
                    )}
                  />
                </FormGroup>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label={t("layers.metadata.title")}
                  fullWidth
                  {...register("metadata.title")}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label={t("layers.metadata.urlTitle")}
                  fullWidth
                  {...register("metadata.urlTitle")}
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  label="Url"
                  fullWidth
                  {...register("metadata.url")}
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  label={t("layers.layerDisplayDescription")}
                  fullWidth
                  multiline
                  rows={3}
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
