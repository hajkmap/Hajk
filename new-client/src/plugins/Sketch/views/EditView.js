import React from "react";
import { Grid } from "@material-ui/core";
import Information from "../components/Information";
import { useEffect } from "react";

const EditView = ({ model, localObserver, id }) => {
  // We have to keep track of if we have a feature chosen for modification
  const [feature, setFeature] = React.useState(null);

  // We need a handler that can handle the information sent from the drawModel
  // via the observer. (If the user clicks the map while in edit-mode, the
  // drawModel will publish a message containing the feature clicked (or null).
  const handleModifyMapClick = React.useCallback((clickedFeature) => {
    setFeature(clickedFeature);
  }, []);

  // Let's subscribe to the events that we care about in this view.
  useEffect(() => {
    localObserver.subscribe("drawModel.modify.mapClick", handleModifyMapClick);
    return () => {
      localObserver.unsubscribe("drawModel.modify.mapClick");
    };
  }, [localObserver, handleModifyMapClick]);

  // We have to get some information about the current activity (view)
  const activity = model.getActivityFromId(id);
  return (
    <Grid container>
      <Grid item xs={12}>
        <Information text={activity.information} />
      </Grid>
      <Grid item xs={12}>
        <pre>{JSON.stringify(feature)}</pre>
      </Grid>
    </Grid>
  );
};

export default EditView;
