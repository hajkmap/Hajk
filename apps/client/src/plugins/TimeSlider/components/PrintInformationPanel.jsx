import React from "react";
import { styled } from "@mui/material/styles";
import { Grid, Paper, Typography } from "@mui/material";

import { INFORMATION_PANEL_MODES } from "../constants";

const StyledPaper = styled(Paper)(({ mode, theme }) => ({
  padding: theme.spacing(2),
  color:
    mode === INFORMATION_PANEL_MODES.WARNING
      ? theme.palette.warning.contrastText
      : theme.palette.success.contrastText,
  backgroundColor:
    mode === INFORMATION_PANEL_MODES.WARNING
      ? theme.palette.warning[theme.palette.mode]
      : theme.palette.success[theme.palette.mode],
  variants: [
    {
      props: {
        mode: INFORMATION_PANEL_MODES.ERROR,
      },
      style: {
        color: theme.palette.error.contrastText,
      },
    },
    {
      props: {
        mode: INFORMATION_PANEL_MODES.ERROR,
      },
      style: {
        backgroundColor: theme.palette.error[theme.palette.mode],
      },
    },
  ],
}));

export default function PrintInformationPanel({ message, mode }) {
  return (
    <Grid sx={{ p: 2 }} size={12}>
      <StyledPaper mode={mode}>
        <Typography align="center">{message}</Typography>
      </StyledPaper>
    </Grid>
  );
}
