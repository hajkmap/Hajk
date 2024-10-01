import Grid from "@mui/material/Grid2";
import { List, ListItem, Paper, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useMaps } from "../../api/maps/hooks";
import { useConfig } from "../../hooks/use-config";

export default function MapsPage() {
  const { t } = useTranslation();
  const { config, loading, loadError } = useConfig();
  const { data, isLoading, isError } = useMaps();
  const { maps, count } = data || {};

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
        {t("common.maps")}
        {count && ` (${count})`}
      </Typography>

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
  );
}
