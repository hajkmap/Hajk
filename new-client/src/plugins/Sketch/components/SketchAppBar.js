import React from "react";
import { AppBar, Tab, Tabs, Tooltip } from "@material-ui/core";
import { TABS, PLUGIN_MARGIN } from "../constants";

const SketchAppBar = (props) => {
  return (
    <AppBar position="sticky" color="default" style={{ top: -PLUGIN_MARGIN }}>
      <Tabs
        variant="fullWidth"
        onChange={(e, activeTab) => props.setActiveTab(activeTab)}
        value={props.activeTab}
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
export default SketchAppBar;
