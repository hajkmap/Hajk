// Base
import React from "react";
// Constants
import { PLUGIN_MARGIN } from "../constants";
// Components and views
import SketchAppBar from "../components/SketchAppBar";
import CreateView from "./CreateView";
import SaveUploadView from "./SaveUploadView";

// The SketchView is the main view for the Sketch-plugin.
const SketchView = () => {
  const [activeTab, setActiveTab] = React.useState(0);

  // The current view depends on which tab the user has
  // selected. Tab 0: The "create-view", Tab 1: The "save-upload-view".
  const renderCurrentView = () => {
    switch (activeTab) {
      case 0:
        return <CreateView />;
      case 1:
        return <SaveUploadView />;
      default:
        return null;
    }
  };

  return (
    // The base plugin-window (in which we render the plugins) has a padding
    // of 10 set. In this plugin we want to render the content without this padding,
    // therefore, we add a negative margin to the root container.
    <div id="sketch-plugin-main-content" style={{ margin: -PLUGIN_MARGIN }}>
      <SketchAppBar activeTab={activeTab} setActiveTab={setActiveTab} />
      {renderCurrentView()}
    </div>
  );
};

export default SketchView;
