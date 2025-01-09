import { useRouteError, isRouteErrorResponse } from "react-router";
import { Box } from "@mui/material";
import Forbidden from "./forbidden-page";
import NotFound from "./not-found-page";
import InternalServerPage from "./internal-server-page";

export default function ErrorPage() {
  const error = useRouteError();

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
      {isRouteErrorResponse(error) ? (
        error.status === 403 ? (
          <Forbidden />
        ) : error.status === 404 ? (
          <NotFound />
        ) : error.status === 500 ? (
          <InternalServerPage />
        ) : null
      ) : null}
    </Box>
  );
}
