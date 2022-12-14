import * as React from "react";
import { useSnackbar } from "notistack";

import {
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
} from "@mui/material";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import MoreVertOutlinedIcon from "@mui/icons-material/MoreVertOutlined";

export default function DrawOrderListItemOptions({ layer }) {
  // Prepare the Snackbar - we want to display nice messages when
  // user removes layers.
  const { enqueueSnackbar } = useSnackbar();

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
  const handleCloseOptionsMenu = () => {
    setAnchorEl(null);
  };

  // Hides the options menu by resetting the anchor element
  const onOptionsMenuClose = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setAnchorEl(null);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    layer.set("visible", false);
    layer.set("active", false);
    enqueueSnackbar(`${layer.get("caption")} togs bort från aktiva lager`, {
      variant: "success",
    });
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton
        edge="end"
        aria-controls={optionsMenuIsOpen ? "basic-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={optionsMenuIsOpen ? "true" : undefined}
        onClick={handleShowMoreOptionsClick}
      >
        <MoreVertOutlinedIcon />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={optionsMenuIsOpen}
        onClose={onOptionsMenuClose}
        variant={"menu"}
      >
        <MenuItem onClick={handleDelete}>
          <ListItemIcon>
            <DeleteOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Ta bort</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
