import React from "react";
import { Grid, Typography } from "@mui/material";

import DrawTypeSelector from "../components/DrawTypeSelector";
import Information from "../components/Information";
import FeatureStyleSelector from "../components/featureStyle/FeatureStyleSelector";
import FeatureTextSetter from "../components/FeatureTextSetter";
import SelectFeaturesDialog from "../components/SelectFeaturesDialog";

const AddView = (props) => {
  // Let's destruct some properties from the props
  const { model, activeDrawType, setActiveDrawType, localObserver, drawModel } =
    props;
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
      <FeatureStyleSelector
        activityId={props.id}
        activeDrawType={activeDrawType}
        drawStyle={props.drawStyle}
        drawModel={props.drawModel}
        setDrawStyle={props.setDrawStyle}
        textStyle={props.textStyle}
        setTextStyle={props.setTextStyle}
        map={props.map}
        setPluginShown={props.setPluginShown}
        app={props.app}
        localObserver={props.localObserver}
        globalObserver={props.globalObserver}
        pluginShown={props.pluginShown}
        toggleObjectButton={props.toggleObjectButton}
        setToggleObjectButton={props.setToggleObjectButton}
      />
      <FeatureTextSetter
        localObserver={props.localObserver}
        drawModel={props.drawModel}
      />
      <SelectFeaturesDialog
        localObserver={localObserver}
        drawModel={drawModel}
        model={model}
      />
    </Grid>
  );
};

export default AddView;
