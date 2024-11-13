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
  CircularProgress,
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
import { ServiceUpdateFormData } from "../../api/services";
import DialogWrapper from "../../components/flexible-dialog";
import { useServiceCapabilities } from "../../api/services/";
import ServicesTable from "./service-layers-table";

export default function ServiceSettings() {
  const formRef = useRef<HTMLFormElement | null>(null);
  const { palette } = useTheme();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { id: serviceId } = useParams<{ id: string }>();
  const { data: service, isError, isLoading } = useServiceById(serviceId ?? "");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogUrl, setDialogUrl] = useState(service?.url ?? "");
  const { mutateAsync: updateService, status: updateStatus } =
    useUpdateService();
  const { mutateAsync: deleteService, status: deleteStatus } =
    useDeleteService();
  const {
    affectedLayers: layers,
    isError: layersError,
    isLoading: layersLoading,
  } = useServiceCapabilities({ baseUrl: service?.url ?? "" });

  const [formServiceData, setFormServiceData] = useState<
    DynamicFormContainer<FieldValues>
  >(new DynamicFormContainer<FieldValues>());

  const handleDialogOpen = () => {
    setIsDialogOpen(true);
    setDialogUrl(getValues("url") as string);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
  };

  const handleSaveUrl = () => {
    setValue("url", dialogUrl);
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
      };
      console.log(" Sending payload", payload);
      await updateService({
        serviceId: service?.id ?? "",
        data: payload,
      });
      console.log("Service updated successfully");
      setIsDialogOpen(false);

      navigate("/services");
    } catch (error) {
      console.error("Failed to update service:", error);
    }
  };

  const handleDeleteService = async () => {
    if (!isLoading && service?.id) {
      try {
        await deleteService(service.id);
      } catch (error) {
        console.error("Deletion failed:", error);
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
    "Anslutning",
    CONTAINER_TYPE.ACCORDION
  );
  const accordionNestedContainer2 = new DynamicFormContainer<FieldValues>(
    "Inställningar för request",
    CONTAINER_TYPE.ACCORDION
  );
  const accordionNestedContainer3 = new DynamicFormContainer<FieldValues>(
    "Tillgängliga lager i tjänsten",
    CONTAINER_TYPE.ACCORDION
  );
  const accordionNestedContainer4 = new DynamicFormContainer<FieldValues>(
    "Infoknapp",
    CONTAINER_TYPE.ACCORDION
  );

  panelNestedContainer.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 10,
    name: "name",
    title: `${t("common.name")}`,
    defaultValue: "",
  });

  panelNestedContainer.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    name: "serviceType",
    title: `${t("common.serviceType")}`,
    defaultValue: `${service?.type}`,
    disabled: true,
    gridColumns: 8,
  });
  panelNestedContainer.addInput({
    type: INPUT_TYPE.TEXTAREA,
    gridColumns: 8,
    name: "description",
    title: `${t("services.description")}`,
  });

  accordionNestedContainer.addInput({
    type: INPUT_TYPE.SELECT,
    gridColumns: 8,
    name: "serverType",
    title: `${t("common.serverType")}`,
    defaultValue: "GEOSERVER",
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
    defaultValue: `${service?.url}`,
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
                color: palette.secondary.dark,
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
    defaultValue: "1.1.1",
    optionList: [
      { title: "1.1.1", value: "1.1.1" },
      { title: "1.3.0", value: "1.3.0" },
    ],
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
        <ServicesTable
          layers={layers}
          layersError={layersError}
          layersLoading={layersLoading}
        />
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
  }, [service, layersLoading, layersError]);

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
      <Box
        sx={{
          float: "right",
          display: "flex",
          flexDirection: "column",
          gap: 2,
          p: 2,
          mt: 2,
          mr: 2,
          border: "1px solid",
          borderColor: "grey.400",
          borderRadius: 3,
          maxWidth: "260px",
          textAlign: "center",
          alignItems: "center",
        }}
      >
        <Button
          onClick={handleExternalSubmit}
          sx={{ backgroundColor: palette.secondary.dark }}
          variant="contained"
          disabled={updateStatus === "pending" || deleteStatus === "pending"}
        >
          {updateStatus === "pending" ? (
            <CircularProgress color="secondary" size={30} />
          ) : (
            t("services.dialog.saveBtn")
          )}
        </Button>

        <Button
          onClick={() => {
            void handleDeleteService();
            navigate("/services");
          }}
          disabled={deleteStatus === "pending" || updateStatus === "pending"}
          sx={{ color: palette.secondary.dark }}
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
      <Page title={t("common.settings")}>
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
                sx={{ color: palette.secondary.dark }}
                variant="text"
                onClick={handleDialogClose}
                color="primary"
              >
                {t("services.dialog.closeBtn")}
              </Button>
              <Button
                sx={{ backgroundColor: palette.secondary.dark }}
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
        </DialogWrapper>
      </Page>
    </>
  );
}
