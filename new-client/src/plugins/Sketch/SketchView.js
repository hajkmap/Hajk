import React from "react";
import { Grid, Tab, Tabs, Typography } from "@material-ui/core";
import { Drawer, Tooltip } from "@material-ui/core";
import MenuIcon from "@material-ui/icons/Menu";
import Fab from "@material-ui/core/Fab";
import { TABS, PLUGIN_MARGIN } from "./constants";

const SketchView = () => {
  const [activeTab, setActiveTab] = React.useState(0);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const handleTabChange = (e, activeTab) => {
    setActiveTab(activeTab);
    setDrawerOpen(false);
  };

  const renderOpenDrawerButton = () => {
    return (
      <div
        style={{
          position: "absolute",
          top: PLUGIN_MARGIN,
          left: PLUGIN_MARGIN,
        }}
      >
        <Tooltip title="Öppna verktygsmeny">
          <Fab
            size="small"
            onClick={() => setDrawerOpen(true)}
            aria-label="open-menu"
          >
            <MenuIcon />
          </Fab>
        </Tooltip>
      </div>
    );
  };

  const renderHeader = () => {
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

  const renderTabs = () => {
    return (
      <Tabs orientation="vertical" onChange={handleTabChange} value={activeTab}>
        {TABS.map((tab, index) => {
          return (
            <Tooltip title={tab.tooltip} key={index}>
              <Tab icon={tab.icon} label={tab.label} />
            </Tooltip>
          );
        })}
      </Tabs>
    );
  };

  const renderDrawer = () => {
    return (
      <Drawer
        anchor="left"
        open={drawerOpen}
        PaperProps={{ style: { position: "absolute" } }}
        BackdropProps={{ style: { position: "absolute" } }}
        ModalProps={{
          container: document.getElementById("sketch-plugin-container"),
          style: { position: "absolute" },
        }}
        onClose={() => setDrawerOpen(false)}
      >
        {renderTabs()}
      </Drawer>
    );
  };

  return (
    <div
      id="sketch-plugin-container"
      style={{
        position: "relative",
        margin: -PLUGIN_MARGIN,
        minHeight: "30rem",
      }}
    >
      {renderDrawer()}
      <Grid container id="sketch-plugin-main-content">
        {renderOpenDrawerButton()}
        {renderHeader()}
      </Grid>
    </div>
  );
};

export default SketchView;
