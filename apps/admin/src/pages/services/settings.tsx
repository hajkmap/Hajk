import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import Page from "../../layouts/root/components/page";
import { FieldValues } from "react-hook-form";
import {
  Box,
  Table,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  IconButton,
  useTheme,
  Button,
  TextField,
  Typography,
  CircularProgress,
} from "@mui/material";
import { useServiceById, useUpdateService } from "../../api/services/hooks";
import DynamicFormContainer from "../../components/form-factory/dynamic-form-container";
import CONTAINER_TYPE from "../../components/form-factory/types/container-types";
import INPUT_TYPE from "../../components/form-factory/types/input-type";
import FormRenderer from "../../components/form-factory/form-renderer";
import { DefaultUseForm } from "../../components/form-factory/default-use-form";
import { createOnSubmitHandler } from "../../components/form-factory/form-utils";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { ServiceUpdateFormData } from "../../api/services";
import DialogWrapper from "../../components/flexible-dialog";

function createData(layerName: string, infoClick: boolean, publish: string) {
  return { layerName, infoClick, publish };
}

const rows = [
  createData("Strandskydd", false, "Publicera"),
  createData("Bygglov", true, "Publicera igen (3)"),
];

export default function ServiceSettings() {
  const formRef = useRef<HTMLFormElement | null>(null);
  const { palette } = useTheme();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { id: serviceId } = useParams<{ id: string }>();
  const { data: service, isError, isLoading } = useServiceById(serviceId ?? "");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogUrl, setDialogUrl] = useState(service?.url ?? "");
  const { mutateAsync: updateService, status } = useUpdateService();

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

  const serviceSettingsFormContainer = new DynamicFormContainer<FieldValues>();
  const panelNestedContainer = new DynamicFormContainer<FieldValues>(
    "",
    CONTAINER_TYPE.PANEL,
    {
      backgroundColor: "rgba(237,231,246,1)",
    }
  );
  const accordionNestedContainer = new DynamicFormContainer<FieldValues>(
    "Anslutning",
    CONTAINER_TYPE.ACCORDION,
    {
      backgroundColor: palette.grey[200],
    }
  );
  const accordionNestedContainer2 = new DynamicFormContainer<FieldValues>(
    "Inställningar för request",
    CONTAINER_TYPE.ACCORDION,
    {
      backgroundColor: palette.grey[200],
    }
  );
  const accordionNestedContainer3 = new DynamicFormContainer<FieldValues>(
    "Tillgängliga lager i tjänsten",
    CONTAINER_TYPE.ACCORDION,
    {
      backgroundColor: palette.grey[200],
    }
  );
  const accordionNestedContainer4 = new DynamicFormContainer<FieldValues>(
    "Infoknapp",
    CONTAINER_TYPE.ACCORDION,
    {
      backgroundColor: palette.grey[200],
    }
  );

  panelNestedContainer.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 10,
    name: "name",
    title: "Namn",
    defaultValue: "",
    slotProps: {
      input: {
        style: {
          backgroundColor: palette.common.white,
        },
      },
    },
  });

  panelNestedContainer.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    name: "serviceType",
    title: "Tjänstetyp",
    defaultValue: `${service?.type}`,
    disabled: true,
    gridColumns: 8,
    slotProps: {
      input: {
        style: {
          backgroundColor: palette.common.white,
        },
      },
    },
  });
  panelNestedContainer.addInput({
    type: INPUT_TYPE.TEXTAREA,
    gridColumns: 8,
    name: "description",
    title: "Intern adminbeskrivning av tjänst",
    slotProps: {
      input: {
        style: {
          backgroundColor: palette.common.white,
        },
      },
    },
  });

  accordionNestedContainer.addInput({
    type: INPUT_TYPE.SELECT,
    gridColumns: 8,
    name: "serverType",
    title: "Servertyp",
    defaultValue: "GEOSERVER",
    optionList: [
      { title: "Geoserver", value: "GEOSERVER" },
      { title: "QGIS Server", value: "QGIS_SERVER" },
    ],
    slotProps: {
      input: {
        style: {
          backgroundColor: palette.common.white,
        },
      },
    },
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
        style: {
          backgroundColor: palette.common.white,
        },
      },
    },
  });
  accordionNestedContainer.addInput({
    type: INPUT_TYPE.SELECT,
    gridColumns: 8,
    name: "workSpace",
    title: "Workspace",
    defaultValue: "WORKSPACE_1",
    optionList: [
      { title: "Workspace 1", value: "WORKSPACE_1" },
      { title: "Workspace 2", value: "WORKSPACE_2" },
    ],
    slotProps: {
      input: {
        style: {
          backgroundColor: palette.common.white,
        },
      },
    },
  });
  accordionNestedContainer2.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 8,
    name: "getMapUrl",
    title: `GetMap-url`,
    slotProps: {
      input: {
        style: {
          backgroundColor: palette.common.white,
        },
      },
    },
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
    slotProps: {
      input: {
        style: {
          backgroundColor: palette.common.white,
        },
      },
    },
  });

  accordionNestedContainer2.addInput({
    type: INPUT_TYPE.SELECT,
    gridColumns: 8,
    name: "coordinateSystem",
    title: "Koordinatsystem",
    defaultValue: "EPSG:3006",
    optionList: [
      { title: "EPSG:3006", value: "EPSG:3006" },
      { title: "EPSG:3007", value: "EPSG:3007" },
      { title: "EPSG:4326", value: "EPSG:4326" },
    ],
    slotProps: {
      input: {
        style: {
          backgroundColor: palette.common.white,
        },
      },
    },
  });

  accordionNestedContainer3.addCustomInput({
    type: INPUT_TYPE.CUSTOM,
    kind: "CustomInputSettings",
    name: "customInput",
    title: `${service?.type}`,
    gridColumns: 8,
    defaultValue: "",

    renderer: () => {
      return (
        <>
          <TableContainer component={Paper}>
            <Table sx={{ width: "100%" }} aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell>Lagernamn</TableCell>
                  <TableCell align="right">Infoklick</TableCell>
                  <TableCell align="right">Publiceringar</TableCell>
                  <TableCell align="right">Åtgärder</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => (
                  <TableRow
                    key={row.layerName}
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <TableCell component="th" scope="row">
                      {row.layerName}
                    </TableCell>
                    <TableCell align="right">
                      {row.infoClick ? "Ja" : "Nej"}
                    </TableCell>
                    <TableCell align="right">{row.publish}</TableCell>
                    <TableCell align="right">
                      <IconButton>
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      );
    },
  });

  accordionNestedContainer4.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 8,
    name: "owner",
    title: "Ägare",
    slotProps: {
      input: {
        style: {
          backgroundColor: palette.common.white,
        },
      },
    },
  });
  accordionNestedContainer4.addInput({
    type: INPUT_TYPE.TEXTAREA,
    gridColumns: 8,
    name: "layerDescription",
    title: "Visningsbeskrivning av lager",
    slotProps: {
      input: {
        style: {
          backgroundColor: palette.common.white,
        },
      },
    },
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
          mt: 10,
          mr: 8,
          p: 2,
          border: "1px solid",
          borderColor: "grey.400",
          borderRadius: 3,
          maxWidth: "260px",
          textAlign: "center",
        }}
      >
        <Button
          onClick={handleExternalSubmit}
          sx={{ backgroundColor: palette.secondary.dark }}
          variant="contained"
          disabled={status === "pending"}
        >
          {status === "pending" ? (
            <CircularProgress color="secondary" size={30} />
          ) : (
            t("services.dialog.saveBtn")
          )}
        </Button>
        <Button sx={{ color: palette.secondary.dark }} variant="text">
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
              <Button onClick={handleDialogClose} color="primary">
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
        </DialogWrapper>
      </Page>
    </>
  );
}
