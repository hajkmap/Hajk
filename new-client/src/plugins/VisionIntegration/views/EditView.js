// Base
import React, { useMemo } from "react";
import { styled } from "@mui/material/styles";
import { Button, Chip, Divider, Grid } from "@mui/material";

// Constants
import { HUB_CONNECTION_STATUS } from "../constants";

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
      <Grid container>
        <Grid
          container
          sx={{ marginTop: 0, marginBottom: 1 }}
          justifyContent="center"
        >
          <Divider sx={{ width: "20%" }} />
        </Grid>
        <Grid item xs={12}>
          <Button onClick={() => props.setEditModeActive(false)}>Avbryt</Button>
        </Grid>
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
