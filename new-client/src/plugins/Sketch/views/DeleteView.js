import React from "react";
import { Button, Grid, Typography } from "@material-ui/core";
import Information from "../components/Information";

const DeleteView = ({ id, model, drawModel }) => {
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
          <Typography variant="caption">Senast borttagna objekt:</Typography>
        </Grid>
      </Grid>
      <Grid item>
        <Button
          style={{ width: "100%" }}
          variant="contained"
          onClick={drawModel.removeDrawnFeatures}
        >
          Ta bort alla rit-objekt
        </Button>
      </Grid>
    </Grid>
  );
};

export default DeleteView;
