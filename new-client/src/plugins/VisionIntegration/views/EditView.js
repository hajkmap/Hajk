// Base
import React from "react";
import { styled } from "@mui/material/styles";
import { Button, Grid, Typography } from "@mui/material";

// Constants
import { EDIT_VIEW_CAPTION, EDIT_VIEW_TITLE } from "../constants";

// Components
import SmallDivider from "../components/SmallDivider";
import HubConnectionStatusChip from "../components/HubConnectionStatusChip";

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
          <HubConnectionStatusChip
            hubConnectionStatus={props.hubConnectionStatus}
          />
        </Grid>
      </Grid>
    </Root>
  );
}

export default EditView;
