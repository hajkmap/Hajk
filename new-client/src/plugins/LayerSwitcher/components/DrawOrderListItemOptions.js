import * as React from "react";

import {
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
} from "@mui/material";

import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import MoreVertOutlinedIcon from "@mui/icons-material/MoreVertOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";

export default function DrawOrderListItemOptions({ layer, toggleSettings }) {
  // Element that we will anchor the options menu to is
  // held in state. If it's null (unanchored), we can tell
  // that the menu should be hidden.
  const [anchorEl, setAnchorEl] = React.useState(null);
  const optionsMenuIsOpen = Boolean(anchorEl);

  // Show the options menu by setting an anchor element
  const handleShowMoreOptionsClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setAnchorEl(e.currentTarget);
  };

  // Hides the options menu by resetting the anchor element
  const onOptionsMenuClose = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setAnchorEl(null);
  };

  // Remove the layer from list by setting it's visible and active state.
  const handleDelete = (e) => {
    e.stopPropagation();
    layer.set("visible", false);
    layer.set("active", false);
    setAnchorEl(null);
  };

  // Toggles the settings area for drawlayeritem.
  const handleSettings = (e) => {
    e.stopPropagation();
    toggleSettings();
    setAnchorEl(null);
  };

  // Checks if layer is enabled for removal
  const hasMenuItemDelete = () => {
    return (
      layer.get("layerType") !== "system" && layer.get("layerType") !== "base"
    );
  };

  return (
    <>
      <IconButton
        aria-controls={optionsMenuIsOpen ? "basic-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={optionsMenuIsOpen ? "true" : undefined}
        onClick={handleShowMoreOptionsClick}
      >
        <Tooltip title="Val för lager">
          <MoreVertOutlinedIcon />
        </Tooltip>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={optionsMenuIsOpen}
        onClose={onOptionsMenuClose}
        variant={"menu"}
      >
        {hasMenuItemDelete() ? (
          <MenuItem onClick={handleDelete}>
            <ListItemIcon>
              <DeleteOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Ta bort</ListItemText>
          </MenuItem>
        ) : null}
        <MenuItem onClick={handleSettings}>
          <ListItemIcon>
            <SettingsOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Inställningar</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
