import * as React from "react";
import { useEffect } from "react";
import { ListItemIcon, ListItemText, Menu, MenuItem } from "@mui/material";

import MoreVertOutlinedIcon from "@mui/icons-material/MoreVertOutlined";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import HajkToolTip from "components/HajkToolTip";
import LsIconButton from "./LsIconButton";

export default function QuickAccessOptions({
  handleAddLayersToQuickAccess,
  handleClearQuickAccessLayers,
}) {
  // Element that we will anchor the options menu to is
  // held in state. If it's null (unanchored), we can tell
  // that the menu should be hidden.
  const [anchorEl, setAnchorEl] = React.useState(null);

  const optionsMenuIsOpen = Boolean(anchorEl);
  // Add event listener for closing menu
  useEffect(() => {
    const handleCloseMenu = () => {
      setAnchorEl(null);
    };

    document.addEventListener("closeQuickAccessMenu", handleCloseMenu);
    return () => {
      document.removeEventListener("closeQuickAccessMenu", handleCloseMenu);
    };
  }, []);

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

  return (
    <>
      <LsIconButton
        id="quick-access-actions-menu"
        size="small"
        aria-controls={optionsMenuIsOpen ? "basic-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={optionsMenuIsOpen ? "true" : undefined}
        onClick={handleShowMoreOptionsClick}
      >
        <HajkToolTip title="Fler val för snabbåtkomst">
          <MoreVertOutlinedIcon />
        </HajkToolTip>
      </LsIconButton>
      <Menu
        anchorEl={anchorEl}
        open={optionsMenuIsOpen}
        onClose={onOptionsMenuClose}
        variant={"menu"}
        slotProps={{
          paper: {
            id: "quick-access-actions-menu-content",
          },
        }}
      >
        <MenuItem
          onClick={(e) => {
            e.stopPropagation();
            setAnchorEl(null);
            handleAddLayersToQuickAccess(e);
          }}
        >
          <ListItemIcon>
            <AddOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Lägg till tända lager</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={(e) => {
            e.stopPropagation();
            setAnchorEl(null);
            handleClearQuickAccessLayers(e);
          }}
        >
          <ListItemIcon>
            <DeleteOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Rensa allt</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
