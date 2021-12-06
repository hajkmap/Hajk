import React from "react";
import { IconButton, Grid, Tab, Tabs } from "@material-ui/core";
import { Drawer, Tooltip } from "@material-ui/core";
import MenuIcon from "@material-ui/icons/Menu";
import { TABS } from "./constants";

const SketchView = () => {
  const [activeTab, setActiveTab] = React.useState(1);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const handleTabChange = (e, activeTab) => {
    setActiveTab(activeTab);
    setDrawerOpen(false);
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
      style={{ position: "relative", margin: -10, minHeight: "30rem" }}
    >
      {renderDrawer()}
      <Grid container id="sketch-plugin-main-content">
        <Tooltip title="Öppna verktygsmeny">
          <IconButton onClick={() => setDrawerOpen(!drawerOpen)}>
            <MenuIcon />
          </IconButton>
        </Tooltip>
      </Grid>
    </div>
  );
};

export default SketchView;
