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

import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";

export default function FavoritesOptions({
  handleFavoritesViewToggle,
  loadFavoriteCallback,
  addFavoriteCallback,
  favorites,
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

  // Handle load favorite
  const handleLoad = (e, favorite) => {
    e.stopPropagation();
    setAnchorEl(null);
    loadFavoriteCallback(favorite, true, false);
  };

  // Handle add favorite action
  const handleAdd = (e) => {
    e.stopPropagation();
    setAnchorEl(null);
    addFavoriteCallback();
  };

  // Handle edit favorites
  const handleEditFavorites = (e) => {
    e.stopPropagation();
    setAnchorEl(null);
    handleFavoritesViewToggle({ event: e });
  };

  return (
    <>
      <IconButton
        size="small"
        id="favorites-menu-button"
        aria-controls={optionsMenuIsOpen ? "favorites-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={optionsMenuIsOpen ? "true" : undefined}
        onClick={handleShowMoreOptionsClick}
      >
        <Tooltip title="Mina favoriter">
          <PersonOutlinedIcon />
        </Tooltip>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        id="favorites-menu"
        aria-labelledby="favorites-menu-button"
        open={optionsMenuIsOpen}
        onClose={onOptionsMenuClose}
        variant={"menu"}
        onClick={(e) => e.stopPropagation()}
      >
        <MenuItem onClick={handleAdd}>
          <ListItemIcon>
            <AddOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Lägg till favorit</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleEditFavorites}>
          <ListItemIcon>
            <EditOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Redigera favoriter</ListItemText>
        </MenuItem>
        {favorites.length > 0 && <Divider />}
        {favorites.map((favorite) => {
          return (
            <MenuItem
              key={favorite.metadata.title}
              onClick={(e) => handleLoad(e, favorite)}
            >
              <ListItemIcon>
                <LayersOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>{favorite.metadata.title}</ListItemText>
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
}
