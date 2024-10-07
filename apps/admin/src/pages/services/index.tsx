import Grid from "@mui/material/Grid2";
import { List, ListItem, Paper, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import Page from "../../layouts/root/components/page";

import { useServices } from "../../api/services";

export default function ServicesPage() {
  const { t } = useTranslation();
  const { data: services, isLoading } = useServices();

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
    </Page>
  );
}
