import React from "react";
import { styled } from "@mui/material/styles";
import { Grid, Paper, Typography } from "@mui/material";

import { INFORMATION_PANEL_MODES } from "../constants";

const StyledPaper = styled(Paper)(({ mode, theme }) => ({
  padding: theme.spacing(2),
  color:
    mode === INFORMATION_PANEL_MODES.ERROR
      ? theme.palette.error.contrastText
      : mode === INFORMATION_PANEL_MODES.WARNING
      ? theme.palette.warning.contrastText
      : theme.palette.success.contrastText,
  backgroundColor:
    mode === INFORMATION_PANEL_MODES.ERROR
      ? theme.palette.error[theme.palette.mode]
      : mode === INFORMATION_PANEL_MODES.WARNING
      ? theme.palette.warning[theme.palette.mode]
      : theme.palette.success[theme.palette.mode],
}));

export default function PrintInformationPanel({ message, mode }) {
  return (
    <Grid item xs={12} sx={{ p: 2 }}>
      <StyledPaper mode={mode}>
        <Typography align="center">{message}</Typography>
      </StyledPaper>
    </Grid>
  );
}
