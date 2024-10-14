import { useState } from "react";
import Grid from "@mui/material/Grid2";
import { List, ListItem, Paper, Typography, Box, Button } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useMaps } from "../../api/maps";
import Page from "../../layouts/root/components/page";
import LanguageSwitcher from "../../components/language-switcher";
import ThemeSwitcher from "../../components/theme-switcher";
import AccordionFormContainer from "../../components/collapsible-form-container";
import useAppStateStore from "../../store/use-app-state-store";

export default function MapsPage() {
  const { t } = useTranslation();
  const { collapseAllPanels } = useAppStateStore();
  const { data: maps, isLoading } = useMaps();
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
    <Page title={t("common.maps")}>
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <>
          <Grid size={12}>
            <Typography variant="h2" textAlign="center">
              {t("common.maps")}
              {maps && ` (${maps.length})`}
            </Typography>

            <List>
              {maps?.map((map) => (
                <ListItem key={map} sx={{ padding: "10px 10px 10px 0" }}>
                  <Paper sx={{ width: "100%", p: 2 }} elevation={4}>
                    <Typography>{map}</Typography>
                  </Paper>
                </ListItem>
              ))}
            </List>
            <Grid container gap={2} size={12}>
              <ThemeSwitcher />
              <LanguageSwitcher />
            </Grid>
          </Grid>
        </>
      )}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
        <Button
          sx={{ color: "mediumpurple", borderColor: "mediumpurple" }}
          variant="outlined"
          onClick={() => collapseAllPanels("testTwo")}
        >
          {t("common.accordionBtn.collapse")}
        </Button>
      </Box>
      <AccordionFormContainer
        componentKey="testTwo"
        panelId="maps"
        title="Kartor"
        inputs={[
          {
            type: "SELECT",
            key: "mapService",
            title: t("common.services.selectTitle"),
            showToolTip: true,
            toolTipDescription: "test",
            options: maps?.map((map) => ({
              key: map,
              value: map,
              label: map,
            })),
          },
          {
            type: "TEXT",
            key: "mapUrl",
            title: "URL to map",
            showToolTip: true,
            isUrl: true,
          },
          {
            type: "NUMBER",
            key: "mapNumber",
            title: "map Number",
            showToolTip: true,
          },
          {
            type: "DATE",
            key: "mapDate",
            title: "map Date",
            showToolTip: true,
          },
        ]}
        values={values}
        setValues={handleChange}
      />
    </Page>
  );
}
