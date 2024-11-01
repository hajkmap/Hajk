import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";

import { useTranslation } from "react-i18next";
import Page from "../../layouts/root/components/page";
import { FieldValues } from "react-hook-form";
import {
  Box,
  TextField,
  Table,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  IconButton,
  useTheme,
} from "@mui/material";
import { useServiceById } from "../../api/services/hooks";
import DynamicFormContainer from "../../components/form-factory/dynamic-form-container";
import CONTAINER_TYPE from "../../components/form-factory/types/container-types";
import INPUT_TYPE from "../../components/form-factory/types/input-type";
import FormRenderer from "../../components/form-factory/form-renderer";
import { DefaultUseForm } from "../../components/form-factory/default-use-form";
import { createOnSubmitHandler } from "../../components/form-factory/form-utils";
import { RenderProps } from "../../components/form-factory/types/render";
import MoreVertIcon from "@mui/icons-material/MoreVert";

function createData(layerName: string, infoClick: boolean, publish: string) {
  return { layerName, infoClick, publish };
}

const rows = [
  createData("Strandskydd", false, "Publicera"),
  createData("Bygglov", true, "Publicera igen (3)"),
];

export default function ServiceSettings() {
  const { palette } = useTheme();
  const { t } = useTranslation();
  const { id: serviceId } = useParams<{ id: string }>();
  const { data: service, isLoading, isError } = useServiceById(serviceId ?? "");

  const [formServiceData, setFormServiceData] = useState<
    DynamicFormContainer<FieldValues>
  >(new DynamicFormContainer<FieldValues>());

  const formServiceSettingsContainer = new DynamicFormContainer<FieldValues>();
  const serviceNestedContainer = new DynamicFormContainer<FieldValues>(
    "",
    CONTAINER_TYPE.PANEL,
    {
      backgroundColor: "rgba(237,231,246,1)",
    }
  );
  const serviceNestedContainer3 = new DynamicFormContainer<FieldValues>(
    "Anslutning",
    CONTAINER_TYPE.ACCORDION,
    {
      backgroundColor: palette.grey[200],
    }
  );
  const serviceNestedContainer4 = new DynamicFormContainer<FieldValues>(
    "Inställningar för request",
    CONTAINER_TYPE.ACCORDION,
    {
      backgroundColor: palette.grey[200],
    }
  );
  const serviceNestedContainer5 = new DynamicFormContainer<FieldValues>(
    "Tillgängliga lager i tjänsten",
    CONTAINER_TYPE.ACCORDION,
    {
      backgroundColor: palette.grey[200],
    }
  );
  const serviceNestedContainer6 = new DynamicFormContainer<FieldValues>(
    "Infoknapp",
    CONTAINER_TYPE.ACCORDION,
    {
      backgroundColor: palette.grey[200],
    }
  );

  serviceNestedContainer.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 8,
    name: "name",
    title: "Namn",
    defaultValue: "",
    registerOptions: {
      required: "This field is required.",
      minLength: {
        value: 5,
        message: "Minimum length is 5 characters.",
      },
    },
    slotProps: {
      input: {
        style: {
          backgroundColor: palette.common.white,
        },
      },
    },
  });

  serviceNestedContainer.addCustomInput({
    type: INPUT_TYPE.CUSTOM,
    kind: "CustomInputSettings",
    name: "serviceType",
    title: `${service?.type}`,
    gridColumns: 8,
    defaultValue: "",

    renderer: (props: RenderProps<FieldValues>) => {
      return (
        <>
          <TextField
            fullWidth
            variant="filled"
            disabled={true}
            label={props.title}
            error={!!props.errorMessage}
            helperText={props.errorMessage}
            slotProps={{
              input: { style: { backgroundColor: palette.common.white } },
            }}
          />
        </>
      );
    },
  });
  serviceNestedContainer.addInput({
    type: INPUT_TYPE.TEXTAREA,
    gridColumns: 10,
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

  serviceNestedContainer3.addInput({
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
  serviceNestedContainer3.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 8,
    name: "url",
    title: `${service?.url}`,
    slotProps: {
      input: {
        style: {
          backgroundColor: palette.common.white,
        },
      },
    },
  });
  serviceNestedContainer3.addInput({
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
  serviceNestedContainer4.addInput({
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
  serviceNestedContainer4.addInput({
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

  serviceNestedContainer4.addInput({
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

  serviceNestedContainer5.addCustomInput({
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

  serviceNestedContainer6.addInput({
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
  serviceNestedContainer6.addInput({
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

  formServiceSettingsContainer.addContainer([
    serviceNestedContainer,
    serviceNestedContainer3,
    serviceNestedContainer4,
    serviceNestedContainer5,
    serviceNestedContainer6,
  ]);

  useEffect(() => {
    setFormServiceData(formServiceSettingsContainer);
  }, [service]);
  const defaultValues = formServiceSettingsContainer.getDefaultValues();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, dirtyFields },
  } = DefaultUseForm(defaultValues);

  const onSubmit = createOnSubmitHandler({
    handleSubmit,
    dirtyFields,
    onValid: (data) => {
      console.log(" ", data);
    },
  });

  if (isLoading) {
    return <p>Loading...</p>;
  }
  if (isError) return <div>Error fetching service details.</div>;
  if (!service) return <div>Service not found.</div>;

  return (
    <Page title={t("common.settings")}>
      <form onSubmit={onSubmit}>
        <Box>
          <FormRenderer
            data={formServiceData}
            register={register}
            control={control}
            errors={errors}
          />
        </Box>
      </form>
    </Page>
  );
}
