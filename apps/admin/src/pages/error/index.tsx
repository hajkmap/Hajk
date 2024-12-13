import { useRouteError, isRouteErrorResponse } from "react-router";
import Page from "../../layouts/root/components/page";
import { Box } from "@mui/material";
import Forbidden from "./forbidden-page";
import NotFound from "./not-found-page";
import InternalServerPage from "./internal-server-page";

export default function ErrorPage() {
  const error = useRouteError();

  return (
    <Page title="">
      <Box
        sx={{
          textAlign: "center",
          alignItems: "center",
          display: "flex",
          justifyContent: "center",
          py: { xs: 5, md: 12 },
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
    </Page>
  );
}
