// Base
import React, { useState } from "react";
import { styled } from "@mui/material/styles";
import { Button, Grid, Typography } from "@mui/material";

// Constants
import {
  EDIT_STATUS,
  EDIT_VIEW_CAPTION,
  EDIT_VIEW_TITLE,
  MAP_INTERACTIONS,
} from "../constants";

// Components
import SmallDivider from "../components/SmallDivider";
import HubConnectionStatusChip from "../components/HubConnectionStatusChip";
import MapInteractionSelector from "../components/edit/MapInteractionSelector";

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
  const [activeMapInteraction, setActiveMapInteraction] = useState(
    MAP_INTERACTIONS.EDIT_NONE
  );

  const handleSelectMapInteractionChange = (e) => {
    setActiveMapInteraction(e.target.value);
  };

  const handleCancelClick = () => {
    setActiveMapInteraction(MAP_INTERACTIONS.EDIT_NONE);
    props.setEditModeStatus(EDIT_STATUS.INACTIVE);
  };

  return (
    <Root>
      <Grid container justifyContent="center" sx={{ pl: 2, pr: 2 }}>
        <Typography variant="h6" align="center" sx={{ width: "100%" }}>
          {EDIT_VIEW_TITLE}
        </Typography>
        <Typography variant="caption" align="center" sx={{ width: "100%" }}>
          {EDIT_VIEW_CAPTION}
        </Typography>
        <SmallDivider mt={1} mb={1} />
        <MapInteractionSelector
          interaction={activeMapInteraction}
          handleChange={handleSelectMapInteractionChange}
        />
      </Grid>
      <Grid container justifyContent="center">
        <Grid container spacing={2} justifyContent="center">
          <Grid item>
            <Button
              size="small"
              sx={{ minWidth: 100 }}
              variant="contained"
              onClick={handleCancelClick}
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
