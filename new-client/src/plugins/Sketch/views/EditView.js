import React from "react";
import { Grid, Paper } from "@material-ui/core";
import { Tooltip, Typography, Switch } from "@material-ui/core";

import Information from "../components/Information";
import FeatureStyleEditor from "../components/featureStyle/FeatureStyleEditor";

const ModifyNodeToggler = ({ modifyEnabled, setModifyEnabled }) => {
  return (
    <Paper style={{ padding: 8, marginTop: 8 }}>
      <Grid container justify="space-between">
        <Typography variant="body2">Tillåt redigering av noder</Typography>
        <Tooltip title="Tillåt redigering av noder TODO">
          <Switch
            checked={modifyEnabled}
            onChange={() => setModifyEnabled(!modifyEnabled)}
            size="small"
            color="primary"
          />
        </Tooltip>
      </Grid>
    </Paper>
  );
};

const EditView = (props) => {
  // We have to get some information about the current activity (view)
  const activity = props.model.getActivityFromId(props.id);
  return (
    <Grid container>
      <Grid item xs={12}>
        <Information text={activity.information} />
      </Grid>
      <Grid item xs={12}>
        <ModifyNodeToggler
          drawModel={props.drawModel}
          modifyEnabled={props.modifyEnabled}
          setModifyEnabled={props.setModifyEnabled}
        />
      </Grid>
      <Grid item xs={12} style={{ marginTop: 8 }}>
        {props.editFeature === null ? (
          <Typography>
            Klicka på ett objekt i kartan för att ändra dess utseende.
          </Typography>
        ) : (
          <FeatureStyleEditor
            feature={props.editFeature}
            model={props.model}
            drawModel={props.drawModel}
          />
        )}
      </Grid>
    </Grid>
  );
};

export default EditView;
