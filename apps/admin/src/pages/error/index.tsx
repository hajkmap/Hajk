import { useRouteError, isRouteErrorResponse } from "react-router";
import { Box } from "@mui/material";
import Forbidden from "./forbidden-page";
import NotFound from "./not-found-page";
import InternalServerPage from "./internal-server-page";
import { HttpError } from "../../lib/http-error";
import { useTranslation } from "react-i18next";

export default function ErrorPage() {
  const error = useRouteError();
  const { t } = useTranslation();

  const status = isRouteErrorResponse(error)
    ? error.status
    : error instanceof HttpError
    ? error.status
    : 500;

  return (
    <Box
      sx={{
        textAlign: "center",
        alignItems: "center",
        display: "flex",
        justifyContent: "center",
        minHeight: "100vh",
      }}
    >
      {status === 403 ? (
        <Forbidden />
      ) : status === 404 ? (
        <NotFound />
      ) : status === 500 ? (
        <InternalServerPage />
      ) : (
        <Box>{t("error.unknown")}</Box>
      )}
    </Box>
  );
}
