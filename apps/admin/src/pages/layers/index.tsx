import Grid from "@mui/material/Grid2";
import { List, ListItem, Paper, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useLayers } from "../../api/layers";
import { useConfig } from "../../hooks/use-config";

export default function LayersPage() {
  const { t } = useTranslation();
  const { config, loading, loadError } = useConfig();
  const { data, isLoading, isError } = useLayers();
  const { layers, count } = data || {};

  console.log(
    `apiBaseUrl: ${config?.apiBaseUrl}, config loading: ${loading}, config load error: ${loadError}`
  );

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error</div>;
  }

  return (
    <Grid size={12}>
      <Typography variant="h2" textAlign="center">
        {t("common.layers")}
        {count && ` (${count})`}
      </Typography>

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
  );
}
