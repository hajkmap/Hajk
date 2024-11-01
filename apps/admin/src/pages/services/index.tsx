import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Grid from "@mui/material/Grid2";
import {
  List,
  ListItem,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import Page from "../../layouts/root/components/page";
import DynamicFormContainer from "../../components/form-factory/dynamic-form-container";
import { FieldValues } from "react-hook-form";
import INPUT_TYPE from "../../components/form-factory/types/input-type";
import FormRenderer from "../../components/form-factory/form-renderer";
import { DefaultUseForm } from "../../components/form-factory/default-use-form";
import { createOnSubmitHandler } from "../../components/form-factory/form-utils";
import { useServices, useCreateService } from "../../api/services";
import { ServiceFormData } from "../../api/services/types";

enum ServiceType {
  ARCGIS = "ARCGIS",
  VECTOR = "VECTOR",
  WFS = "WFS",
  WFST = "WFST",
  WMS = "WMS",
  WMTS = "WMTS",
}

export default function ServicesPage() {
  const navigate = useNavigate();

  const { t } = useTranslation();
  const { data: services, isLoading } = useServices();
  const createServiceMutation = useCreateService();

  console.log("services: ", services);

  const [open, setOpen] = useState<boolean>(false);
  const [catchError, setCatchError] = useState<string>();
  const [serviceUrl, setServiceUrl] = useState<
    DynamicFormContainer<FieldValues>
  >(new DynamicFormContainer<FieldValues>());

  const serviceUrlContainer = new DynamicFormContainer<FieldValues>();

  serviceUrlContainer.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 12,
    name: "url",
    title: "Url",
    defaultValue: "",
    registerOptions: {
      required: "This field is required.",
      minLength: {
        value: 5,
        message: "Minimum length is 5 characters.",
      },
    },
  });

  useEffect(() => {
    setServiceUrl(serviceUrlContainer);
  }, []);

  const defaultValues = serviceUrl.getDefaultValues();

  const handleClickOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
    setCatchError(undefined);
  };

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, dirtyFields },
    reset,
  } = DefaultUseForm(defaultValues);

  const fetchCapabilities = async (url: string): Promise<ServiceType> => {
    if (url.includes("/wfs")) {
      return ServiceType.WFS;
    } else if (url.includes("/wms")) {
      return ServiceType.WMS;
    } else if (url.includes("/wmts")) {
      return ServiceType.WMTS;
    } else if (url.includes("/wfst/")) {
      return ServiceType.WFST;
    } else if (url.includes("/arcgis/") || url.includes("/services/")) {
      return ServiceType.ARCGIS;
    } else if (url.includes("/vector/")) {
      return ServiceType.VECTOR;
    }

    try {
      const capabilitiesUrl = `${url}?service=WFS&request=GetCapabilities`;
      const response = await fetch(capabilitiesUrl);

      if (!response.ok) {
        throw new Error(`Error fetching capabilities: ${response.statusText}`);
      }

      const text = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, "text/xml");

      const serviceName = xmlDoc
        .getElementsByTagName("Service")[0]
        ?.getElementsByTagName("Name")[0]?.textContent;

      if (serviceName) {
        if (serviceName.includes("WFS")) {
          return ServiceType.WFS;
        } else if (serviceName.includes("WMS")) {
          return ServiceType.WMS;
        } else if (serviceName.includes("WMTS")) {
          return ServiceType.WMTS;
        } else if (serviceName.includes("ARCGIS")) {
          return ServiceType.ARCGIS;
        } else if (serviceName.includes("VECTOR")) {
          return ServiceType.VECTOR;
        } else if (serviceName.includes("WFST")) {
          return ServiceType.WFST;
        }
      }

      throw new Error(
        "Could not determine service type from capabilities response."
      );
    } catch (error) {
      console.error("Failed to fetch capabilities:", error);
      throw error;
    }
  };

  const handleServiceSubmit = async (serviceData: ServiceFormData) => {
    try {
      const serviceType = await fetchCapabilities(serviceData.url);

      const payload = {
        locked: true,
        type: serviceType,
        url: serviceData.url,
        serverType: "QGIS_SERVER",
        comment: "Test comment",
      };

      await createServiceMutation.mutateAsync(payload);
      reset({ url: "" });
      handleClose();
      setCatchError(undefined);
    } catch (error) {
      console.error("Failed to submit service:", error);
      setCatchError((error as Error).message);
    }
  };

  const onSubmit = createOnSubmitHandler({
    handleSubmit,
    dirtyFields,
    onValid: (data: FieldValues) => {
      const serviceData = data as ServiceFormData;

      void handleServiceSubmit(serviceData);
    },
    onInvalid: (errors) => {
      console.log("Errors: ", errors);
    },
  });

  return (
    <Page title={t("common.services")}>
      {isLoading ? (
        <Box component="div">Loading...</Box>
      ) : (
        <>
          <Button
            onClick={handleClickOpen}
            variant="contained"
            sx={{ float: "right", mr: 2, mb: 1 }}
          >
            {t("services.dialog.addBtn")}
          </Button>
          <Dialog fullWidth open={open} onClose={handleClose}>
            <DialogTitle>{t("services.dialog.title")}</DialogTitle>
            <form onSubmit={onSubmit}>
              <DialogContent>
                <FormRenderer
                  data={serviceUrl}
                  register={register}
                  control={control}
                  errors={errors}
                />
                {catchError && (
                  <Typography style={{ color: "red" }}>{catchError}</Typography>
                )}
              </DialogContent>
              <DialogActions sx={{ mb: 2, mr: 2 }}>
                <Button onClick={handleClose} color="primary">
                  {t("services.dialog.closeBtn")}
                </Button>
                <Button type="submit" color="primary" variant="contained">
                  {t("services.dialog.addBtn")}
                </Button>
              </DialogActions>
            </form>
          </Dialog>
          <Grid size={12}>
            <Box component="p">
              services.length = {services && ` (${services.length})`}
            </Box>

            <List>
              {services?.map((service) => (
                <ListItem
                  key={service.id}
                  onClick={() =>
                    navigate(`/services/servicesettings/${service.id}`)
                  }
                >
                  <Paper sx={{ width: "100%", p: 2 }} elevation={4}>
                    <Typography sx={{ cursor: "pointer" }}>
                      {service.url}
                    </Typography>
                  </Paper>
                </ListItem>
              ))}
            </List>
          </Grid>
        </>
      )}
    </Page>
  );
}
