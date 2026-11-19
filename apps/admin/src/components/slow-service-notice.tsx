import { Alert, Box } from "@mui/material";
import { useTranslation } from "react-i18next";
import ProgressCircular from "./progress/circular-progress";

/** Takes the waiting indicator's place once a service has been slow to answer. */
export default function SlowServiceNotice() {
  const { t } = useTranslation();
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Alert severity="info">{t("services.slowAnswer")}</Alert>
      <ProgressCircular color="primary" size={30} />
    </Box>
  );
}
