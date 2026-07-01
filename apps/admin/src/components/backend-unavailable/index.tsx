import { useTranslation } from "react-i18next";
import { Alert, AlertTitle, Box, Button } from "@mui/material";
import useAppStateStore from "../../store/use-app-state-store";

export default function BackendUnavailable() {
  const { t } = useTranslation();
  const { checkBackend, backendStatus, apiBaseUrl } = useAppStateStore();

  return (
    <Box
      sx={{
        display: "flex",
        pl: { xs: 0, sm: 10 },
        pr: { xs: 0, sm: 10 },
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        minHeight: "100vh",
      }}
    >
      <Alert severity="error" sx={{ mt: -30 }}>
        <AlertTitle>{t("backend.unavailableTitle")}</AlertTitle>
        {t("backend.unavailableMessage", { url: apiBaseUrl })}
      </Alert>
      <Button
        variant="contained"
        sx={{ mt: 3 }}
        disabled={backendStatus === "checking"}
        onClick={() => void checkBackend()}
      >
        {backendStatus === "checking"
          ? t("common.loading")
          : t("common.retry")}
      </Button>
    </Box>
  );
}
