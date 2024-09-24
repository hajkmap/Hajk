import Grid from "@mui/material/Grid2";
import { List, ListItem, Paper, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useLayers } from "../../api/layers";

export default function LayersPage() {
  const { t } = useTranslation();
  const { data: layers } = useLayers();

  return (
    <Grid size={12}>
      <Typography variant="h2" textAlign="center">
        {t("common.layers")}
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
