// Base
import React, { useMemo } from "react";
import { styled } from "@mui/material/styles";
import { Button, Chip, Grid, Typography } from "@mui/material";

// Constants
import {
  EDIT_VIEW_CAPTION,
  EDIT_VIEW_TITLE,
  HUB_CONNECTION_STATUS,
} from "../constants";

// Components
import SmallDivider from "../components/SmallDivider";

const Root = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  padding: theme.spacing(1),
  width: "100%",
  height: "100%",
  minHeight: 300,
}));

function EditView(props) {
  // We're gonna want to display a chip with some information regarding the hub-connection-status.
  // Let's get the information every time the connection-status changes.
  const hubChipInformation = useMemo(() => {
    const label =
      props.hubConnectionStatus === HUB_CONNECTION_STATUS.LOADING
        ? "Upprättar koppling mot Vision"
        : props.hubConnectionStatus === HUB_CONNECTION_STATUS.SUCCESS
        ? "Uppkopplad mot Vision"
        : "Uppkoppling mot Vision misslyckad";
    const color =
      props.hubConnectionStatus === HUB_CONNECTION_STATUS.LOADING
        ? "warning"
        : props.hubConnectionStatus === HUB_CONNECTION_STATUS.SUCCESS
        ? "success"
        : "error";

    return { label, color };
  }, [props.hubConnectionStatus]);

  return (
    <Root>
      <Grid container justifyContent="center" sx={{ pl: 2, pr: 2 }}>
        <Typography variant="h6" align="center" sx={{ width: "100%" }}>
          {EDIT_VIEW_TITLE}
        </Typography>
        <Typography variant="caption" align="center" sx={{ width: "100%" }}>
          {EDIT_VIEW_CAPTION}
        </Typography>
      </Grid>
      <Grid container justifyContent="center">
        <Grid container spacing={2} justifyContent="center">
          <Grid item>
            <Button
              size="small"
              sx={{ minWidth: 100 }}
              variant="contained"
              onClick={() => props.setEditModeActive(false)}
            >
              Avbryt
            </Button>
          </Grid>
          <Grid item>
            <Button
              size="small"
              sx={{ minWidth: 100 }}
              variant="contained"
              disabled
            >
              Spara
            </Button>
          </Grid>
        </Grid>
        <SmallDivider mt={1} />
        <Grid item container justifyContent="center">
          <Chip
            color={hubChipInformation.color}
            size="small"
            label={hubChipInformation.label}
          />
        </Grid>
      </Grid>
    </Root>
  );
}

export default EditView;
