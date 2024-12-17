import Grid from "@mui/material/Grid2";
import { List, ListItem, Paper, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import Page from "../../layouts/root/components/page";
import { useLayers } from "../../api/layers";

export default function LayersPage() {
  const { t } = useTranslation();
  const { data: layers, isLoading } = useLayers();

  return (
    <Page title={t("common.layers")}>
      {isLoading ? (
        <div>{t("common.loading")}</div>
      ) : (
        <Grid size={12}>
          <p>layers.length = {layers && ` (${layers.length})`}</p>

          <List>
            {layers?.map((layer) => (
              <ListItem key={layer.id}>
                <Paper sx={{ width: "100%", p: 2 }} elevation={4}>
                  <Typography>{layer.options.caption}</Typography>
                </Paper>
              </ListItem>
            ))}
          </List>
        </Grid>
      )}
    </Page>
  );
}
