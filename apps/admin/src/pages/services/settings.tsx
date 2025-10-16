import { useParams } from "react-router";
import { useState, useRef } from "react";
import { useTranslation, Trans } from "react-i18next";
import Page from "../../layouts/root/components/page";
import { Controller, FieldValues, useForm } from "react-hook-form";
import {
  useTheme,
  Button,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
} from "@mui/material";
import {
  useServiceById,
  useUpdateService,
  useDeleteService,
  useLayersByServiceId,
  SERVICE_TYPE,
  ServiceUpdateInput,
  serverTypes,
  versions,
  imageFormats,
  useProjections,
  useServiceCapabilities,
} from "../../api/services";
import Grid from "@mui/material/Grid2";
import FormContainer from "../../components/form-components/form-container";
import FormPanel from "../../components/form-components/form-panel";
import FormAccordion from "../../components/form-components/form-accordion";
import DialogWrapper from "../../components/flexible-dialog";
import LayersGrid from "./layers-grid";
import { toast } from "react-toastify";

import FormActionPanel from "../../components/form-action-panel";
import { SquareSpinnerComponent } from "../../components/progress/square-progress";
import useAppStateStore from "../../store/use-app-state-store";
import { HttpError } from "../../lib/http-error";

export default function ServiceSettings() {
  const formRef = useRef<HTMLFormElement | null>(null);
  const { palette } = useTheme();
  const { t } = useTranslation();
  const { serviceId } = useParams<{ serviceId: string }>();
  const { data: service, isError, isLoading } = useServiceById(serviceId ?? "");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogUrl, setDialogUrl] = useState(service?.url ?? "");
  const [dialogServiceType, setDialogServiceType] = useState(
    service?.type ?? ""
  );

  const { data: projections } = useProjections();
  const epsgProjections =
    projections?.filter((projection) => projection.code.startsWith("EPSG:")) ??
    [];
  const epsgProjectionsMap = epsgProjections?.map((projection) => ({
    title: projection.code,
    value: projection.code,
  }));
  const { mutateAsync: updateService, status: updateStatus } =
    useUpdateService();
  const { mutateAsync: deleteService, status: deleteStatus } =
    useDeleteService();
  const { data: layersByServiceId } = useLayersByServiceId(serviceId ?? "");
  const count = layersByServiceId?.count ?? 0;
  const { defaultCoordinates } = useAppStateStore.getState();
  const {
    layers: getCapLayers,
    workspaces: getCapWorkspaces,
    isError: layersError,
    isLoading: layersLoading,
  } = useServiceCapabilities({
    baseUrl: service?.url ?? "",
    type: service?.type ?? "",
  });
  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<FieldValues>({
    defaultValues: {
      name: service?.name ?? "",
      type: service?.type ?? "",
      comment: service?.comment ?? "",
      serverType: service?.serverType ?? "",
      url: service?.url ?? "",
      workspace: service?.workspace ?? "All",
      getMapUrl: service?.getMapUrl ?? "",
      version: service?.version ?? "",
      imageFormat: service?.imageFormat ?? "",
      "projection.code": service?.projection?.code ?? "",
      "metadata.owner": service?.metadata?.owner ?? "",
      "metadata.description": service?.metadata?.description ?? "",
    },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const handleDialogOpen = () => {
    setIsDialogOpen(true);
    setDialogUrl(getValues("url") as string);
    setDialogServiceType(getValues("type") as string);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
  };

  const handleSaveUrl = () => {
    setValue("url", dialogUrl);
    setValue("type", dialogServiceType);
    handleDialogClose();
  };

  const handleExternalSubmit = () => {
    if (formRef.current) {
      formRef.current.requestSubmit();
    }
  };

  const handleUpdateService = async (serviceData: ServiceUpdateInput) => {
    try {
      const payload = {
        name: serviceData.name,
        url: serviceData.url,
        type: serviceData.type,
        serverType: serviceData.serverType,
        version: serviceData.version,
        imageFormat: serviceData.imageFormat,
        workspace: serviceData.workspace,
        getMapUrl: serviceData.getMapUrl,
        comment: serviceData.comment,
        projection: {
          code: serviceData.projection?.code,
        },
        metadata: {
          description: serviceData.metadata?.description,
          owner: serviceData.metadata?.owner,
        },
      };
      await updateService({
        serviceId: service?.id ?? "",
        data: payload,
      });
      toast.success(
        t("services.updateServiceSuccess", { name: serviceData.name }),
        {
          position: "bottom-left",
          theme: palette.mode,
          hideProgressBar: true,
        }
      );
    } catch (error) {
      console.error("Failed to update service:", error);
      toast.error(t("services.updateServiceFailed", { name: service?.name }), {
        position: "bottom-left",
        theme: palette.mode,
        hideProgressBar: true,
      });
    }
  };
  // TODO?: Add delete service
  const handleDeleteService = async () => {
    if (!isLoading && service?.id) {
      try {
        await deleteService(service.id);
        toast.success(
          t("services.deleteServiceSuccess", { name: service.name }),
          {
            position: "bottom-left",
            theme: palette.mode,
            hideProgressBar: true,
          }
        );
      } catch (error) {
        console.error("Deletion failed:", error);
        toast.error(t("services.deleteServiceFailed", { name: service.name }), {
          position: "bottom-left",
          theme: palette.mode,
          hideProgressBar: true,
        });
      }
    } else {
      console.error("Service data is still loading or unavailable.");
    }
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void handleSubmit((data: FieldValues) => {
      const serviceData = data as ServiceUpdateInput;
      void handleUpdateService(serviceData);
    })(e);
  };

  if (isLoading) {
    return <SquareSpinnerComponent />;
  }
  if (!service) {
    throw new HttpError(404, "Service not found");
  }

  if (isError) return <div>Error fetching service details.</div>;

  return (
    <Page title={t("common.settings")}>
      <FormActionPanel
        updateStatus={updateStatus}
        onUpdate={handleExternalSubmit}
        saveButtonText="Spara"
      >
        <FormContainer formRef={formRef} onSubmit={onSubmit} noValidate={false}>
          <FormPanel title={t("common.information")}>
            <Grid container>
              <Grid size={12}>
                <TextField
                  label={t("common.name")}
                  fullWidth
                  defaultValue={service?.name}
                  {...register("name", { required: `${t("common.required")}` })}
                  error={!!errors.name}
                  helperText={
                    (errors.name as { message?: string } | undefined)?.message
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, md: 10 }}>
                <TextField
                  label={t("common.serviceType")}
                  fullWidth
                  defaultValue={service?.type}
                  InputProps={{ readOnly: true }}
                  {...register("type")}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 10 }}>
                <TextField
                  label={t("services.description")}
                  fullWidth
                  multiline
                  rows={3}
                  defaultValue={service?.comment}
                  {...register("comment")}
                />
              </Grid>
            </Grid>
          </FormPanel>

          <FormAccordion title={t("common.connection")}>
            <Grid container>
              <Grid size={{ xs: 12, md: 8 }}>
                <FormControl fullWidth error={!!errors.serverType}>
                  <InputLabel id="serverType-label">
                    {t("common.serverType")}
                  </InputLabel>
                  <Controller
                    name="serverType"
                    control={control}
                    rules={{ required: `${t("common.required")}` }}
                    defaultValue={service?.serverType}
                    render={({ field }) => (
                      <Select
                        labelId="serverType-label"
                        label={t("common.serverType")}
                        {...field}
                      >
                        {serverTypes.map((s) => (
                          <MenuItem key={s.value} value={s.value}>
                            {s.title}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 8 }}>
                <TextField
                  label="Url"
                  fullWidth
                  disabled
                  defaultValue={service?.url}
                  {...register("url")}
                  InputProps={{
                    endAdornment: (
                      <Button
                        sx={{ color: palette.primary.main, fontWeight: 600 }}
                        size="small"
                        onClick={handleDialogOpen}
                      >
                        {t("services.url.btnLabel")}
                      </Button>
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 8 }}>
                <FormControl fullWidth>
                  <InputLabel id="workspace-label">
                    {t("services.workspace")}
                  </InputLabel>
                  <Controller
                    name="workspace"
                    control={control}
                    defaultValue={service?.workspace ?? "All"}
                    render={({ field }) => (
                      <Select
                        labelId="workspace-label"
                        label={t("services.workspace")}
                        {...field}
                      >
                        <MenuItem value="All">{t("common.all")}</MenuItem>
                        {(getCapWorkspaces ?? []).map((w) => (
                          <MenuItem key={w} value={w}>
                            {w}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                </FormControl>
              </Grid>
            </Grid>
          </FormAccordion>

          <FormAccordion title={t("services.settings.request")}>
            <Grid container>
              <Grid size={{ xs: 12, md: 8 }}>
                <TextField
                  label="GetMap-url"
                  fullWidth
                  defaultValue={service?.getMapUrl}
                  {...register("getMapUrl")}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 8 }}>
                <FormControl fullWidth error={!!errors.version}>
                  <InputLabel id="version-label">Version</InputLabel>
                  <Controller
                    name="version"
                    control={control}
                    rules={{ required: `${t("common.required")}` }}
                    defaultValue={service?.version}
                    render={({ field }) => (
                      <Select
                        labelId="version-label"
                        label="Version"
                        {...field}
                      >
                        {versions.map((v) => (
                          <MenuItem key={v.value} value={v.value}>
                            {v.title}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 8 }}>
                <FormControl fullWidth>
                  <InputLabel id="imageFormat-label">
                    {t("services.imageFormats")}
                  </InputLabel>
                  <Controller
                    name="imageFormat"
                    control={control}
                    defaultValue={service?.imageFormat}
                    render={({ field }) => (
                      <Select
                        labelId="imageFormat-label"
                        label={t("services.imageFormats")}
                        {...field}
                      >
                        {imageFormats.map((f) => (
                          <MenuItem key={f.value} value={f.value}>
                            {f.title}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 8 }}>
                <FormControl fullWidth>
                  <InputLabel id="projection-label">
                    {t("services.coordinateSystem")}
                  </InputLabel>
                  <Controller
                    name="projection.code"
                    control={control}
                    defaultValue={service?.projection?.code}
                    render={({ field }) => (
                      <Select
                        labelId="projection-label"
                        label={t("services.coordinateSystem")}
                        {...field}
                      >
                        {defaultCoordinates.map((value) => {
                          const opt = epsgProjectionsMap?.find(
                            (p) => p.value === value
                          );
                          return (
                            <MenuItem key={value} value={opt?.value ?? value}>
                              {opt?.title ?? value}
                            </MenuItem>
                          );
                        })}
                      </Select>
                    )}
                  />
                </FormControl>
              </Grid>
            </Grid>
          </FormAccordion>

          <FormAccordion title={t("common.infobutton")}>
            <Grid container>
              <Grid size={{ xs: 12, md: 8 }}>
                <TextField
                  label={t("services.owner")}
                  fullWidth
                  defaultValue={service?.metadata?.owner}
                  {...register("metadata.owner")}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 8 }}>
                <TextField
                  label={t("services.layerDescription")}
                  fullWidth
                  multiline
                  rows={3}
                  defaultValue={service?.metadata?.description}
                  {...register("metadata.description")}
                />
              </Grid>
            </Grid>
          </FormAccordion>

          <LayersGrid
            layers={getCapLayers}
            serviceId={service.id}
            isError={layersError}
            isLoading={layersLoading}
          />
        </FormContainer>
      </FormActionPanel>
      <DialogWrapper
        fullWidth
        open={isDialogOpen}
        title={t("services.settings.dialog.title")}
        onClose={handleDialogClose}
        actions={
          <>
            <Button variant="text" onClick={handleDialogClose} color="primary">
              {t("common.dialog.closeBtn")}
            </Button>
            <Button onClick={handleSaveUrl} color="primary" variant="contained">
              {t("common.dialog.saveBtn")}
            </Button>
          </>
        }
      >
        {count >= 1 && (
          <Trans
            i18nKey="services.affectedLayers"
            values={{ count: layersByServiceId?.count }}
            components={{ strong: <strong /> }}
          />
        )}
        <TextField
          label="Url"
          value={dialogUrl}
          fullWidth
          variant="outlined"
          onChange={(e) => setDialogUrl(e.target.value)}
          error={!!errors.url}
          margin="normal"
        />
        <FormControl
          sx={{ mt: 2, width: "100%", maxWidth: "150px" }}
          fullWidth
          error={!!errors.type}
        >
          <InputLabel id="type">{t("common.serviceType")}</InputLabel>
          <Select
            label={t("common.serviceType")}
            value={dialogServiceType}
            variant="outlined"
            onChange={(e) => setDialogServiceType(e.target.value)}
          >
            {Object.keys(SERVICE_TYPE).map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogWrapper>
    </Page>
  );
}
