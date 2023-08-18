import React from "react";
import { Alert, AlertTitle, Box, Button } from "@mui/material";

export default function Error({
  loadErrorMessage,
  loadErrorTitle,
  loadErrorReloadButtonText,
}) {
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
        <AlertTitle>{loadErrorTitle}</AlertTitle>
        {loadErrorMessage}
      </Alert>
      <Button href="/" variant="contained" sx={{ mt: 3 }}>
        {loadErrorReloadButtonText}
      </Button>
    </Box>
  );
}
