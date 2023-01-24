// Base
import React, { useState, useEffect } from "react";
import { styled } from "@mui/material/styles";
import { Button, Grid, LinearProgress, Typography } from "@mui/material";

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

function NumFeaturesTypography({ features }) {
  return (
    <Typography variant="caption" align="center" sx={{ width: "100%" }}>
      {`Antal ytor: ${features.length}`}
    </Typography>
  );
}

function EditView(props) {
  const [activeMapInteraction, setActiveMapInteraction] = useState(
    MAP_INTERACTIONS.EDIT_NONE
  );

  useEffect(() => {
    props.mapViewModel.toggleMapInteraction(activeMapInteraction);
  }, [props.mapViewModel, activeMapInteraction]);

  const handleSelectMapInteractionChange = (e) => {
    setActiveMapInteraction(e.target.value);
  };

  const handleCancelClick = () => {
    setActiveMapInteraction(MAP_INTERACTIONS.EDIT_NONE);
    props.setEditState((prev) => ({ ...prev, mode: EDIT_STATUS.INACTIVE }));
  };

  const handleSaveClick = () => {
    setActiveMapInteraction(MAP_INTERACTIONS.EDIT_NONE);
    props.model.handleEditSaveClick();
  };

  const showLoadingIndicator = [
    EDIT_STATUS.SEARCH_LOADING,
    EDIT_STATUS.WAITING,
  ].includes(props.editState.mode);

  const disableInteractions =
    showLoadingIndicator ||
    [EDIT_STATUS.SAVE_SUCCESS, EDIT_STATUS.SAVE_FAILED].includes(
      props.editState.mode
    );

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
          disabled={disableInteractions}
          interaction={activeMapInteraction}
          handleChange={handleSelectMapInteractionChange}
        />
        <SmallDivider mt={1} mb={1} />
        <Typography variant="caption" align="center" sx={{ width: "100%" }}>
          {props.editState.text}
        </Typography>
        {props.editState.mode === EDIT_STATUS.ACTIVE && (
          <NumFeaturesTypography features={props.editState.features} />
        )}
        {showLoadingIndicator && (
          <Grid item xs={10}>
            <LinearProgress />
          </Grid>
        )}
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
              {props.editState.mode === EDIT_STATUS.SAVE_SUCCESS
                ? "Bakåt"
                : "Avbryt"}
            </Button>
          </Grid>
          <Grid item>
            <Button
              size="small"
              sx={{ minWidth: 100 }}
              variant="contained"
              onClick={handleSaveClick}
              disabled={disableInteractions}
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
