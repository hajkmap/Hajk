import React from "react";
import { styled } from "@material-ui/core";
import { Button, IconButton, Zoom } from "@material-ui/core";
import { Grid, Typography, Tooltip, Paper } from "@material-ui/core";
import SettingsBackupRestoreIcon from "@material-ui/icons/SettingsBackupRestore";

import Information from "../components/Information";

const StyledPaper = styled(Paper)(({ theme }) => ({
  width: "100%",
  padding: theme.spacing(1),
  marginBottom: theme.spacing(1),
  borderLeft: `${theme.spacing(0.5)}px solid ${theme.palette.success.main}`,
}));

const RemovedFeatureItem = ({ onRestoreClick, title }) => {
  return (
    <Zoom in appear>
      <StyledPaper>
        <Grid container justify="space-between" alignItems="center">
          <Typography variant="button">{title}</Typography>
          <Tooltip title="Klicka för att återställa ritobjektet.">
            <IconButton size="small" onClick={onRestoreClick}>
              <SettingsBackupRestoreIcon />
            </IconButton>
          </Tooltip>
        </Grid>
      </StyledPaper>
    </Zoom>
  );
};

const DeleteView = ({ id, model, drawModel, removedFeatures }) => {
  // We have to get some information about the current activity (view)
  const activity = model.getActivityFromId(id);

  return (
    <Grid
      container
      direction="column"
      justify="space-between"
      style={{ height: "100%" }}
    >
      <Grid container>
        <Grid item>
          <Information text={activity.information} />
        </Grid>
        <Grid item style={{ marginTop: 8 }}>
          <Typography variant="caption">Senast borttagna:</Typography>
        </Grid>
        <Grid container>
          {removedFeatures.map((feature) => {
            return (
              <RemovedFeatureItem
                key={feature.get("HANDLED_ID")}
                title={feature.get("HANDLED_AT")}
                onRestoreClick={() => drawModel.addFeature(feature)}
              />
            );
          })}
        </Grid>
      </Grid>
      <Grid item>
        <Button
          style={{ width: "100%" }}
          variant="contained"
          onClick={drawModel.removeDrawnFeatures}
        >
          Ta bort alla ritobjekt
        </Button>
      </Grid>
    </Grid>
  );
};

export default DeleteView;
