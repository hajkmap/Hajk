import { Alert } from "@mui/material";
import { useTranslation } from "react-i18next";

/** Takes the waiting indicator's place once a service has been slow to answer. */
export default function SlowServiceNotice() {
  const { t } = useTranslation();
  return <Alert severity="info">{t("services.slowAnswer")}</Alert>;
}
