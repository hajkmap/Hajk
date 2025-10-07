import Grid from "@mui/material/Grid2";
import { useTranslation } from "react-i18next";

import Page from "../../layouts/root/components/page";
import DatabaseExportCard from "./components/export-card";
import DatabaseImportCard from "./components/import-card";
import DatabaseStatusCard from "./components/status-card";
import DatabaseExportsList from "./components/exports-list";

export default function DatabasePage() {
  const { t } = useTranslation();

  return (
    <Page title={t("database.title")}>
      <Grid container spacing={3}>
        <Grid size={12}>
          <DatabaseStatusCard />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <DatabaseExportCard />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <DatabaseImportCard />
        </Grid>
        <Grid size={12}>
          <DatabaseExportsList />
        </Grid>
      </Grid>
    </Page>
  );
}
