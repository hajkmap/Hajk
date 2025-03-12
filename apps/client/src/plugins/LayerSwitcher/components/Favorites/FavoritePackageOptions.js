import * as React from "react";

import {
  IconButton,
  Divider,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
} from "@mui/material";

import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import MoreVertOutlinedIcon from "@mui/icons-material/MoreVertOutlined";

export default function FavoritePackageOptions({
  infoCallback,
  deleteCallback,
  downloadCallback,
  editCallback,
  favorite,
}) {
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

  // Handle download action
  const handleDownload = (e) => {
    e.stopPropagation();
    setAnchorEl(null);
    downloadCallback(favorite);
  };

  // Handle info action
  const handleInfo = (e) => {
    e.stopPropagation();
    setAnchorEl(null);
    infoCallback(favorite);
  };

  // Handle edit action
  const handleEdit = (e) => {
    e.stopPropagation();
    setAnchorEl(null);
    editCallback(favorite);
  };

  // Handle delete action
  const handleDelete = (e) => {
    e.stopPropagation();
    setAnchorEl(null);
    deleteCallback(favorite);
  };

  return (
    <>
      <IconButton
        size="small"
        aria-controls={optionsMenuIsOpen ? "basic-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={optionsMenuIsOpen ? "true" : undefined}
        onClick={handleShowMoreOptionsClick}
      >
        <Tooltip title="Hantera">
          <MoreVertOutlinedIcon />
        </Tooltip>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={optionsMenuIsOpen}
        onClose={onOptionsMenuClose}
        variant={"menu"}
        onClick={(e) => e.stopPropagation()}
      >
        <MenuItem onClick={handleInfo}>
          <ListItemIcon>
            <InfoOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Info</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleEdit}>
          <ListItemIcon>
            <EditOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Redigera</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDelete}>
          <ListItemIcon>
            <DeleteOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Ta bort</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleDownload}>
          <ListItemIcon>
            <FileDownloadOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Exportera</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
