import React from "react";
import { Grid, Paper } from "@material-ui/core";
import { Tooltip, Typography, Switch } from "@material-ui/core";
import Information from "../components/Information";

const ModifyNodeToggler = ({ translateEnabled, setTranslateEnabled }) => {
  return (
    <Paper style={{ padding: 8, marginTop: 8 }}>
      <Grid container justify="space-between" alignItems="center">
        <Typography variant="body2">Tillåt fri förflyttning</Typography>
        <Tooltip
          title={
            translateEnabled
              ? "Avaktivera för att inte tillåta förflyttning av objekten i kartan."
              : "Aktivera för att tillåta förflyttning av objekten i kartan."
          }
        >
          <Switch
            checked={translateEnabled}
            onChange={() => setTranslateEnabled(!translateEnabled)}
            size="small"
            color="primary"
          />
        </Tooltip>
      </Grid>
    </Paper>
  );
};

const MoveView = (props) => {
  // We have to get some information about the current activity (view)
  const activity = props.model.getActivityFromId(props.id);
  return (
    <Grid container>
      <Grid item xs={12}>
        <Information text={activity.information} />
      </Grid>
      <Grid item xs={12}>
        <ModifyNodeToggler
          translateEnabled={props.translateEnabled}
          setTranslateEnabled={props.setTranslateEnabled}
        />
        <Grid item xs={12}>
          <Typography>
            Här ska vi ha förflyttning med meter och grader
          </Typography>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default MoveView;
