import { useState } from "react";
import Grid from "@mui/material/Grid2";
import { List, ListItem, Paper, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import Page from "../../layouts/root/components/page";
import { useServices } from "../../api/services";
import AccordionFormContainer from "../../components/collapsible-form-container";

export default function ServicesPage() {
  const { t } = useTranslation();
  const { data: services, isLoading } = useServices();
  const [values, setValues] = useState<
    Record<string, string | number | boolean | Record<string, boolean>>
  >({});

  const handleChange = (
    key: string,
    value: string | number | boolean | Record<string, boolean>
  ) => {
    setValues((prevValues) => ({
      ...prevValues,
      [key]: value,
    }));
  };

  return (
    <Page title={t("common.services")}>
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <Grid size={12}>
          <p>services.length = {services && ` (${services.length})`}</p>

          <List>
            {services?.map((service) => (
              <ListItem key={service.id}>
                <Paper sx={{ width: "100%", p: 2 }} elevation={4}>
                  <Typography>{service.url}</Typography>
                </Paper>
              </ListItem>
            ))}
          </List>
        </Grid>
      )}
      <AccordionFormContainer
        title="Anslutning"
        inputs={[
          {
            type: "SELECT",
            key: "serverType",
            title: t("common.services.selectTitle"),
            showToolTip: true,
            toolTipDescription: "test",
            options: services?.map((service) => ({
              key: service.id,
              label: service.type,
              value: service.type,
            })),
          },
          {
            type: "TEXT",
            key: "serverUrl",
            title: "URL to Service",
            showToolTip: true,
          },
          {
            type: "NUMBER",
            key: "serverNumber",
            title: "Server Number",
            showToolTip: true,
          },
          {
            type: "DATE",
            key: "serverDate",
            title: "Service Date",
            showToolTip: true,
          },
          {
            type: "SLIDER",
            key: "serverSlider",
            title: "Server slider",
            min: 1,
            max: 10,
            step: 1,
            showToolTip: true,
          },
          {
            type: "CHECKBOX",
            key: "serverCheckbox",
            title: "Select Features",
            options: [
              { label: "Red", value: "red" },
              { label: "Blue", value: "blue" },
              { label: "Green", value: "green" },
            ],
          },
          {
            type: "RADIO",
            key: "color",
            title: "Choose a Color",
            options: [
              { label: "Red", value: "red" },
              { label: "Blue", value: "blue" },
              { label: "Green", value: "green" },
            ],
          },
        ]}
        values={values}
        setValues={handleChange}
      />
    </Page>
  );
}
