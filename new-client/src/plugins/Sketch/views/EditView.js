import React from "react";
import { Button, Grid, Paper } from "@material-ui/core";
import { Tooltip, Typography, Switch } from "@material-ui/core";

import Information from "../components/Information";
import FeatureStyleEditor from "../components/featureStyle/FeatureStyleEditor";

const ModifyNodeToggler = ({ modifyEnabled, setModifyEnabled }) => {
  return (
    <Paper style={{ padding: 8, marginTop: 8 }}>
      <Grid container justify="space-between" alignItems="center">
        <Typography variant="body2">Tillåt redigering av noder</Typography>
        <Tooltip
          title={
            modifyEnabled
              ? "Avaktivera redigering av noder för att enklare kunna selektera objekt i kartan för redigering av färg etc."
              : "Aktivera för att kunna redigera objektens utbredning i kartan."
          }
        >
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
    <Grid
      container
      direction="column"
      justify="space-between"
      style={{ height: "100%" }}
    >
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
        <Grid item xs={12}>
          {props.editFeature === null ? (
            <Typography align="center" style={{ marginTop: 24 }}>
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
      {props.editFeature && (
        <Grid container style={{ marginTop: 8 }}>
          <Tooltip title="Klicka för att duplicera det markerade objektet.">
            <Button
              variant="contained"
              fullWidth
              onClick={() =>
                props.drawModel.duplicateFeature(props.editFeature)
              }
            >
              Duplicera objekt
            </Button>
          </Tooltip>
        </Grid>
      )}
    </Grid>
  );
};

export default EditView;
