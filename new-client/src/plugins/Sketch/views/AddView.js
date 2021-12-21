import React from "react";
import { Grid } from "@material-ui/core";

import DrawTypeSelector from "../components/DrawTypeSelector";
import Information from "../components/Information";

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
        <DrawTypeSelector
          activeDrawType={activeDrawType}
          setActiveDrawType={setActiveDrawType}
        />
      </Grid>
    </Grid>
  );
};

export default AddView;
