import { useState } from "react";
import Grid from "@mui/material/Grid2";
import { List, ListItem, Paper, Typography, Box, Button } from "@mui/material";
import { useTranslation } from "react-i18next";
import Page from "../../layouts/root/components/page";
import { useServices } from "../../api/services";
import AccordionFormContainer from "../../components/collapsible-form-container";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import useAppStateStore from "../../store/use-app-state-store";

export default function ServicesPage() {
  const { t } = useTranslation();
  const { collapseAllPanels } = useAppStateStore();
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
      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
        <Button
          sx={{ color: "mediumpurple", borderColor: "mediumpurple" }}
          variant="outlined"
          onClick={() => collapseAllPanels("test")}
          startIcon={<ExpandLessIcon />}
        >
          {t("common.accordionBtn.collapse")}
        </Button>
      </Box>
      <AccordionFormContainer
        componentKey="test"
        panelId="server"
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
            isUrl: true,
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
        ]}
        values={values}
        setValues={handleChange}
      />
      <AccordionFormContainer
        componentKey="test"
        panelId="reqsettings"
        title="Inställningar för request"
        inputs={[
          {
            type: "SELECT",
            key: "reqType",
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
            key: "requestSettings",
            title: "URL to Service",
            showToolTip: true,
            isUrl: true,
          },
          {
            type: "NUMBER",
            key: "reqnumber",
            title: "req Number",
            showToolTip: true,
          },
        ]}
        values={values}
        setValues={handleChange}
      />
    </Page>
  );
}
