import React from "react";
import { Button, Grid } from "@material-ui/core";
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
      <Grid item>
        <Information text={activity.information} />
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
