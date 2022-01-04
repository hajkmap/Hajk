import React from "react";
import { Grid, Typography } from "@material-ui/core";

import DrawTypeSelector from "../components/DrawTypeSelector";
import Information from "../components/Information";
import DrawStyleSelector from "../components/DrawStyleSelector";

const AddView = (props) => {
  // Let's destruct some properties from the props
  const { model, activeDrawType, setActiveDrawType } = props;
  // We have to get some information about the current activity (view)
  const activity = model.getActivityFromId(props.id);
  return (
    <Grid container>
      <Grid item xs={12}>
        <Information text={activity.information} />
      </Grid>
      <Grid item xs={12} style={{ marginTop: 16 }}>
        <Grid item xs={12} style={{ marginBottom: 4 }}>
          <Typography align="center">Typ</Typography>
        </Grid>
        <Grid item xs={12}>
          <DrawTypeSelector
            activeDrawType={activeDrawType}
            setActiveDrawType={setActiveDrawType}
          />
        </Grid>
      </Grid>
      <Grid item xs={12} style={{ marginTop: 16 }}>
        <Grid item xs={12} style={{ marginBottom: 4 }}>
          <Typography align="center">Utseende</Typography>
        </Grid>
        <Grid item xs={12}>
          <DrawStyleSelector
            activeDrawType={activeDrawType}
            drawStyle={props.drawStyle}
            drawModel={props.drawModel}
            setDrawStyle={props.setDrawStyle}
          />
        </Grid>
      </Grid>
    </Grid>
  );
};

export default AddView;
