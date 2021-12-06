import React from "react";
import { IconButton, Grid, Tab, Tabs } from "@material-ui/core";
import { Drawer, Tooltip } from "@material-ui/core";

import AddIcon from "@material-ui/icons/Add";
import EditIcon from "@material-ui/icons/Edit";
import ImportExportIcon from "@material-ui/icons/ImportExport";
import MenuIcon from "@material-ui/icons/Menu";
import SettingsIcon from "@material-ui/icons/Settings";

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
        <Tooltip title="Skapa nya objekt">
          <Tab icon={<AddIcon />} label="Lägg till" />
        </Tooltip>
        <Tooltip title="Editera existerande objekt">
          <Tab icon={<SettingsIcon />} label="Editera" />
        </Tooltip>
        <Tooltip title="Editera existerande objekt">
          <Tab icon={<EditIcon />} label="Editera" />
        </Tooltip>
        <Tooltip title="Importera och exportera till/från en .kml fil.">
          <Tab icon={<ImportExportIcon />} label="Spara" />
        </Tooltip>
        <Tooltip title="Inställningar">
          <Tab icon={<SettingsIcon />} label="Inställningar" />
        </Tooltip>
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
        variant="temporary"
      >
        {renderTabs()}
      </Drawer>
    );
  };

  return (
    <div
      container
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
