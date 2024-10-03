import Grid from "@mui/material/Grid2";
import { List, ListItem, Paper, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useMaps } from "../../api/maps";
import Page from "../../layouts/root/components/page";

export default function MapsPage() {
  const { t } = useTranslation();
  const { data: maps, isLoading } = useMaps();

  return (
    <Page title={t("common.maps")}>
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <Grid size={12}>
          <p>maps.length = {maps && ` (${maps.length})`}</p>
          <List>
            {maps?.map((map) => (
              <ListItem key={map}>
                <Paper sx={{ width: "100%", p: 2 }} elevation={4}>
                  <Typography>{map}</Typography>
                </Paper>
              </ListItem>
            ))}
          </List>
        </Grid>
      )}
    </Page>
  );
}
