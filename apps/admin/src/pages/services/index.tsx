import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Grid from "@mui/material/Grid2";
import {
  List,
  ListItem,
  Paper,
  Typography,
  Button,
  Box,
  useTheme,
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
import { ServiceCreateFormData, ServiceType } from "../../api/services/types";
import DialogWrapper from "../../components/flexible-dialog";

export default function ServicesPage() {
  const navigate = useNavigate();
  const { palette } = useTheme();
  const { t } = useTranslation();
  const { data: services, isLoading } = useServices();
  const { mutateAsync: createService } = useCreateService();
  const [open, setOpen] = useState<boolean>(false);

  const [service, setService] = useState<DynamicFormContainer<FieldValues>>(
    new DynamicFormContainer<FieldValues>()
  );

  const serviceContainer = new DynamicFormContainer<FieldValues>();

  serviceContainer.addInput({
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

  serviceContainer.addInput({
    type: INPUT_TYPE.SELECT,
    gridColumns: 4,
    name: "type",
    title: `${t("common.serviceType")}`,
    defaultValue: ServiceType[4],
    optionList: ServiceType.map((type) => ({
      title: type,
      value: type,
    })),
  });

  useEffect(() => {
    setService(serviceContainer);
  }, [services]);

  const defaultValues = service.getDefaultValues();

  const handleClickOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, dirtyFields },
    reset,
  } = DefaultUseForm(defaultValues);

  const handleServiceSubmit = async (serviceData: ServiceCreateFormData) => {
    try {
      const payload = {
        locked: true,
        type: serviceData.type,
        url: serviceData.url,
        serverType: "QGIS_SERVER",
        comment: "Test comment",
      };

      await createService(payload);
      reset({ url: "" });
      handleClose();
    } catch (error) {
      console.error("Failed to submit service:", error);
    }
  };

  const onSubmit = createOnSubmitHandler({
    handleSubmit,
    dirtyFields,

    onValid: (data: FieldValues) => {
      const serviceData = data as ServiceCreateFormData;
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
            sx={{
              float: "right",
              mr: 2,
              mb: 1,
              backgroundColor: palette.secondary.dark,
            }}
          >
            {t("services.dialog.addBtn")}
          </Button>
          <DialogWrapper
            fullWidth
            open={open}
            title={t("services.dialog.title")}
            onClose={handleClose}
            onSubmit={onSubmit}
            actions={
              <>
                <Button
                  sx={{ color: palette.secondary.dark }}
                  variant="text"
                  onClick={handleClose}
                  color="primary"
                >
                  {t("services.dialog.closeBtn")}
                </Button>
                <Button
                  sx={{ backgroundColor: palette.secondary.dark }}
                  type="submit"
                  color="primary"
                  variant="contained"
                >
                  {t("services.dialog.saveBtn")}
                </Button>
              </>
            }
          >
            <FormRenderer
              data={service}
              register={register}
              control={control}
              errors={errors}
            />
          </DialogWrapper>
          <Grid size={12}>
            <Box component="p">
              services.length = {services && ` (${services.length})`}
            </Box>

            <List>
              {services?.map((service) => (
                <ListItem
                  key={service.id}
                  onClick={() => navigate(`/services/${service.id}`)}
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
