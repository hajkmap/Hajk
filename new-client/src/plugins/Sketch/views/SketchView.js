// Base
import React from "react";
import { Grid } from "@material-ui/core";
// Constants
import { PLUGIN_MARGIN } from "../constants";
// Components and views
import ActivityMenu from "../components/ActivityMenu";
import AddView from "./AddView";
import SaveUploadView from "./SaveUploadView";

// The SketchView is the main view for the Sketch-plugin.
const SketchView = () => {
  const [activity, setActivity] = React.useState("ADD");

  // The current view depends on which tab the user has
  // selected. Tab 0: The "create-view", Tab 1: The "save-upload-view".
  const renderCurrentView = () => {
    switch (activity) {
      case "ADD":
        return <AddView />;
      case "SAVE":
        return <SaveUploadView />;
      default:
        return null;
    }
  };

  return (
    // The base plugin-window (in which we render the plugins) has a padding
    // of 10 set. In this plugin we want to render the <ActivityMenu /> at the
    // border of the window, hence we must set a negative margin of 10.
    <Grid container>
      <Grid item xs={3} style={{ marginLeft: -PLUGIN_MARGIN }}>
        <ActivityMenu activity={activity} setActivity={setActivity} />
      </Grid>
      <Grid item xs={9}>
        {renderCurrentView()}
      </Grid>
    </Grid>
  );
};

export default SketchView;
