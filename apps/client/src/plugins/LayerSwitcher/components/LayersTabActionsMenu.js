import React, { useState } from "react";

import {
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
} from "@mui/material";

import MoreVertOutlinedIcon from "@mui/icons-material/MoreVertOutlined";
import KeyboardDoubleArrowDownIcon from "@mui/icons-material/KeyboardDoubleArrowDown";
import KeyboardDoubleArrowUpIcon from "@mui/icons-material/KeyboardDoubleArrowUp";

const LayersTabActionsMenu = ({ scrollToTop, scrollToBottom }) => {
  // Element that we will anchor the options menu to is
  // held in state. If it's null (unanchored), we can tell
  // that the menu should be hidden.
  const [anchorEl, setAnchorEl] = useState(null);

  const [menuIsOpen, setMenuIsOpen] = useState(false);

  // Show the options menu by setting an anchor element
  const handleShowMoreOptionsClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setAnchorEl(e.currentTarget);
    setMenuIsOpen(true);
  };

  // Hides the options menu by resetting the anchor element
  const onOptionsMenuClose = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setAnchorEl(null);
    setMenuIsOpen(false);
  };

  return (
    <>
      <IconButton
        size="small"
        aria-controls={menuIsOpen ? "basic-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={menuIsOpen ? "true" : undefined}
        onClick={handleShowMoreOptionsClick}
      >
        <Tooltip title="Fler val för snabbåtkomst">
          <MoreVertOutlinedIcon />
        </Tooltip>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={menuIsOpen}
        onClose={onOptionsMenuClose}
        variant={"menu"}
      >
        <MenuItem
          onClick={(e) => {
            e.stopPropagation();
            setAnchorEl(null);
            setMenuIsOpen(false);
            scrollToTop();
          }}
        >
          <ListItemIcon>
            <KeyboardDoubleArrowUpIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Skrolla till toppen</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={(e) => {
            e.stopPropagation();
            setAnchorEl(null);
            setMenuIsOpen(false);
            scrollToBottom();
          }}
        >
          <ListItemIcon>
            <KeyboardDoubleArrowDownIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Scrolla till botten</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

export default LayersTabActionsMenu;
