// Base
import React from "react";
// Constants
import { PLUGIN_MARGIN } from "./constants";
// Components
import SketchAppBar from "./components/SketchAppBar";

const SketchView = () => {
  const [activeTab, setActiveTab] = React.useState(0);

  const renderContent = () => {
    switch (activeTab) {
      case 0:
        return renderCreateView();
      case 1:
        return renderSaveView();
      default:
        return null;
    }
  };

  const renderCreateView = () => {
    return <h2>Skapa</h2>;
  };

  const renderSaveView = () => {
    return <h2>SPARA</h2>;
  };

  return (
    // The base plugin-window (in which we render the plugins) has a padding
    // of 10 set. In this plugin we want to render the content without this padding,
    // therefore, we add a negative margin to the root container.
    <div id="sketch-plugin-main-content" style={{ margin: -PLUGIN_MARGIN }}>
      <SketchAppBar activeTab={activeTab} setActiveTab={setActiveTab} />
      {renderContent()}
    </div>
  );
};

export default SketchView;
