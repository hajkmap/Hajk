import { Button } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useMaps } from "../../api/maps";
import Page from "../../layouts/root/components/page";
import MapsTable from "./components/maps-table";

export default function MapsPage() {
  const { t } = useTranslation();
  const { data: maps, isLoading } = useMaps();

  return (
    <Page
      title={t("common.maps") + (maps && ` (${maps.length})`)}
      actionButtons={
        <>
          <Button color="primary" variant="contained">
            {t("map.createMap")}
          </Button>
        </>
      }
    >
      {isLoading ? (
        <div>{t("common.loading")}</div>
      ) : (
        <>
          <MapsTable />
        </>
      )}
    </Page>
  );
}
