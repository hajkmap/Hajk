import Grid from "@mui/material/Grid2";
import { Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

export default function LayersPage() {
  const { t } = useTranslation();
  return (
    <Grid size={12}>
      <Typography variant="h2" textAlign="center">
        {t("common.layers")}
      </Typography>
    </Grid>
  );
}
