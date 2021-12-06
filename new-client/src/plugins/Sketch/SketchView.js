import React from "react";
import { Grid, Typography } from "@material-ui/core";
import { AppBar, Tab, Tabs, Tooltip } from "@material-ui/core";
import { TABS, PLUGIN_MARGIN } from "./constants";

const SketchView = () => {
  const [activeTab, setActiveTab] = React.useState(0);

  const renderAppBar = () => {
    return (
      <AppBar position="sticky" color="default" style={{ top: -10 }}>
        <Tabs
          variant="fullWidth"
          onChange={(e, activeTab) => setActiveTab(activeTab)}
          value={activeTab}
        >
          {TABS.map((tab, index) => {
            return (
              <Tooltip title={tab.tooltip} key={index}>
                <Tab icon={tab.icon} />
              </Tooltip>
            );
          })}
        </Tabs>
      </AppBar>
    );
  };

  const renderInformationHeader = () => {
    return (
      <Grid
        container
        style={{ padding: PLUGIN_MARGIN, minHeight: 60 }}
        justify="center"
        alignItems="center"
      >
        <Typography variant="button">{TABS[activeTab].label}</Typography>
      </Grid>
    );
  };

  const renderContent = () => {
    return activeTab === 0 ? renderDrawView() : renderSaveView();
  };

  const renderDrawView = () => {
    return <h2>RITA</h2>;
  };

  const renderSaveView = () => {
    return <h2>SPARA</h2>;
  };

  return (
    <div id="sketch-plugin-main-content" style={{ margin: -10 }}>
      {renderAppBar()}
      {renderInformationHeader()}
      {renderContent()}
    </div>
  );
};

export default SketchView;
