import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import Page from "../../layouts/root/components/page";
import { FieldValues } from "react-hook-form";
import {
  Box,
  useTheme,
  Button,
  TextField,
  Typography,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
} from "@mui/material";
import {
  useServiceById,
  useUpdateService,
  useDeleteService,
} from "../../api/services/hooks";
import DynamicFormContainer from "../../components/form-factory/dynamic-form-container";
import CONTAINER_TYPE from "../../components/form-factory/types/container-types";
import INPUT_TYPE from "../../components/form-factory/types/input-type";
import FormRenderer from "../../components/form-factory/form-renderer";
import { DefaultUseForm } from "../../components/form-factory/default-use-form";
import { createOnSubmitHandler } from "../../components/form-factory/form-utils";
import { ServiceUpdateFormData, serviceTypes } from "../../api/services";
import DialogWrapper from "../../components/flexible-dialog";
import ServicesGrid from "./service-layers-grid";
import CircularProgress from "../../components/progress/circular-progress";
import { toast } from "react-toastify";

export default function ServiceSettings() {
  const formRef = useRef<HTMLFormElement | null>(null);
  const { palette } = useTheme();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { serviceId } = useParams<{ serviceId: string }>();
  const { data: service, isError, isLoading } = useServiceById(serviceId ?? "");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogUrl, setDialogUrl] = useState(service?.url ?? "");
  const [dialogServiceType, setDialogServiceType] = useState(
    service?.type ?? ""
  );
  const { mutateAsync: updateService, status: updateStatus } =
    useUpdateService();
  const { mutateAsync: deleteService, status: deleteStatus } =
    useDeleteService();

  const [formServiceData, setFormServiceData] = useState<
    DynamicFormContainer<FieldValues>
  >(new DynamicFormContainer<FieldValues>());

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
  const handleUpdateService = async (serviceData: ServiceUpdateFormData) => {
    try {
      const payload = {
        url: serviceData.url,
        type: serviceData.type,
        serverType: serviceData.serverType,
        version: serviceData.version,
      };
      await updateService({
        serviceId: service?.id ?? "",
        data: payload,
      });
      toast.success(
        t("services.updateServiceSuccess", { name: service?.name }),
        {
          position: "bottom-left",
          theme: palette.mode,
          hideProgressBar: true,
        }
      );
      setIsDialogOpen(false);
      navigate("/services");
    } catch (error) {
      console.error("Failed to update service:", error);
      toast.error(t("services.updateServiceFailed", { name: service?.name }), {
        position: "bottom-left",
        theme: palette.mode,
        hideProgressBar: true,
      });
    }
  };

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

  const serviceSettingsFormContainer = new DynamicFormContainer<FieldValues>();
  const panelNestedContainer = new DynamicFormContainer<FieldValues>(
    "",
    CONTAINER_TYPE.PANEL
  );
  const accordionNestedContainer = new DynamicFormContainer<FieldValues>(
    t("common.connection"),
    CONTAINER_TYPE.ACCORDION
  );
  const accordionNestedContainer2 = new DynamicFormContainer<FieldValues>(
    t("services.settings.accordionTitle1"),
    CONTAINER_TYPE.ACCORDION
  );
  const accordionNestedContainer3 = new DynamicFormContainer<FieldValues>(
    t("services.settings.accordionTitle2"),
    CONTAINER_TYPE.ACCORDION
  );
  const accordionNestedContainer4 = new DynamicFormContainer<FieldValues>(
    t("common.infobutton"),
    CONTAINER_TYPE.ACCORDION
  );

  panelNestedContainer.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 12,
    name: "name",
    title: `${t("common.name")}`,
    defaultValue: service?.name,
    registerOptions: {
      required: `${t("common.required")}`,
    },
  });

  panelNestedContainer.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    name: "type",
    title: `${t("common.serviceType")}`,
    defaultValue: service?.type,
    disabled: true,
    gridColumns: 10,
    registerOptions: {
      required: `${t("common.required")}`,
    },
  });
  panelNestedContainer.addInput({
    type: INPUT_TYPE.TEXTAREA,
    gridColumns: 10,
    name: "description",
    title: `${t("services.description")}`,
  });

  accordionNestedContainer.addInput({
    type: INPUT_TYPE.SELECT,
    gridColumns: 8,
    name: "serverType",
    title: `${t("common.serverType")}`,
    defaultValue: service?.serverType,
    registerOptions: { required: `${t("common.required")}` },
    optionList: [
      { title: "Geoserver", value: "GEOSERVER" },
      { title: "QGIS Server", value: "QGIS_SERVER" },
    ],
  });
  accordionNestedContainer.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 8,
    name: "url",
    disabled: true,
    title: "Url",
    defaultValue: service?.url,
    slotProps: {
      inputLabel: {
        style: {
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          maxWidth: "calc(100% - 120px)",
        },
      },
      input: {
        endAdornment: (
          <>
            <Button
              sx={{
                color: palette.primary.main,
                width: "100%",
                maxWidth: "120px",
                fontWeight: "600",
              }}
              size="small"
              onClick={handleDialogOpen}
            >
              {t("services.url.btnLabel")}
            </Button>
          </>
        ),
      },
    },
  });
  accordionNestedContainer.addInput({
    type: INPUT_TYPE.SELECT,
    gridColumns: 8,
    name: "workSpace",
    title: `${t("services.workspace")}`,
    defaultValue: "WORKSPACE_1",
    optionList: [
      { title: "Workspace 1", value: "WORKSPACE_1" },
      { title: "Workspace 2", value: "WORKSPACE_2" },
    ],
  });
  accordionNestedContainer2.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 8,
    name: "getMapUrl",
    title: `GetMap-url`,
  });
  accordionNestedContainer2.addInput({
    type: INPUT_TYPE.SELECT,
    gridColumns: 8,
    name: "version",
    title: "Version",
    defaultValue: service?.version,
    optionList: [
      { title: "1.1.1", value: "1.1.1" },
      { title: "1.3.0", value: "1.3.0" },
    ],
    registerOptions: {
      required: `${t("common.required")}`,
    },
  });

  accordionNestedContainer2.addInput({
    type: INPUT_TYPE.SELECT,
    gridColumns: 8,
    name: "coordinateSystem",
    title: `${t("services.coordinateSystem")}`,
    defaultValue: "EPSG:3006",
    optionList: [
      { title: "EPSG:3006", value: "EPSG:3006" },
      { title: "EPSG:3007", value: "EPSG:3007" },
      { title: "EPSG:4326", value: "EPSG:4326" },
    ],
  });

  accordionNestedContainer3.addCustomInput({
    type: INPUT_TYPE.CUSTOM,
    kind: "CustomInputSettings",
    name: "customInput",
    title: `${service?.type}`,
    gridColumns: 12,
    defaultValue: "",

    renderer: () => {
      return (
        <ServicesGrid baseUrl={service?.url ?? ""} type={service?.type ?? ""} />
      );
    },
  });

  accordionNestedContainer4.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 8,
    name: "owner",
    title: `${t("services.owner")}`,
  });
  accordionNestedContainer4.addInput({
    type: INPUT_TYPE.TEXTAREA,
    gridColumns: 8,
    name: "layerDescription",
    title: `${t("services.layerDescription")}`,
  });

  serviceSettingsFormContainer.addContainer([
    panelNestedContainer,
    accordionNestedContainer,
    accordionNestedContainer2,
    accordionNestedContainer3,
    accordionNestedContainer4,
  ]);

  useEffect(() => {
    if (!service) return;
    setFormServiceData(serviceSettingsFormContainer);
    setDialogUrl(service.url);
  }, [service]);

  const defaultValues = formServiceData.getDefaultValues();
  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    formState: { errors, dirtyFields },
  } = DefaultUseForm(defaultValues);

  const onSubmit = createOnSubmitHandler({
    handleSubmit,
    dirtyFields,
    onValid: (data: FieldValues) => {
      const serviceData = data as ServiceUpdateFormData;
      void handleUpdateService(serviceData);
    },
  });

  if (isLoading) {
    return <p>Loading...</p>;
  }
  if (isError) return <div>Error fetching service details.</div>;
  if (!service) return <div>Service not found.</div>;

  return (
    <>
      <Page title={t("common.settings")}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            textAlign: "center",
            float: "right",
            gap: 2,
            p: 2,
            ml: 3,
            border: "1px solid",
            borderColor: palette.grey[300],
            borderRadius: 3,
            maxWidth: "260px",
          }}
        >
          <Button
            onClick={handleExternalSubmit}
            variant="contained"
            disabled={updateStatus === "pending" || deleteStatus === "pending"}
          >
            {updateStatus === "pending" ? (
              <CircularProgress color="primary" size={30} />
            ) : (
              t("services.dialog.saveBtn")
            )}
          </Button>

          <Button
            onClick={(e) => {
              e.preventDefault();
              void handleDeleteService();
              navigate("/services");
            }}
            disabled={deleteStatus === "pending" || updateStatus === "pending"}
            variant="text"
          >
            {t("services.dialog.deleteBtn")}
          </Button>

          <Typography variant="body1">
            Senast sparad av
            {/* {user} */} Albin den
            {/* {service.updatedAt} */} 2023-04-11 13:37
          </Typography>
        </Box>
        <form ref={formRef} onSubmit={onSubmit}>
          <Box>
            <FormRenderer
              data={formServiceData}
              register={register}
              control={control}
              errors={errors}
            />
          </Box>
        </form>

        <DialogWrapper
          fullWidth
          open={isDialogOpen}
          title={t("services.settings.dialog.title")}
          onClose={handleDialogClose}
          actions={
            <>
              <Button
                variant="text"
                onClick={handleDialogClose}
                color="primary"
              >
                {t("services.dialog.closeBtn")}
              </Button>
              <Button
                onClick={handleSaveUrl}
                color="primary"
                variant="contained"
              >
                {t("services.dialog.saveBtn")}
              </Button>
            </>
          }
        >
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
              {serviceTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogWrapper>
      </Page>
    </>
  );
}
