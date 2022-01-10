import React from "react";
import { Button, Grid, Typography } from "@material-ui/core";
import Information from "../components/Information";

const DeleteView = ({ id, model, drawModel }) => {
  // We have to get some information about the current activity (view)
  const activity = model.getActivityFromId(id);

  // We have to handle the click on the "remove all features" button. When clicked, we
  // want to display the features that were just removed in a list.
  const handleRemoveAllFeaturesClick = () => {
    const { removedFeatures } = drawModel.removeDrawnFeatures();
    // These features (or at least some of them) can be added to
    // the list of recently removed features.
    console.log("Removed Features: ", removedFeatures);
  };

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
      </Grid>
      <Grid item>
        <Button
          style={{ width: "100%" }}
          variant="contained"
          onClick={handleRemoveAllFeaturesClick}
        >
          Ta bort alla ritobjekt
        </Button>
      </Grid>
    </Grid>
  );
};

export default DeleteView;
