import React from "react";
import IconButton from "@material-ui/core/IconButton";
import MoreHorizIcon from "@material-ui/icons/MoreHoriz";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";

const SearchTools = props => {
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleClick = event => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <div>
      <IconButton
        aria-controls="simple-menu"
        aria-haspopup="true"
        onClick={handleClick}
      >
        <MoreHorizIcon />
      </IconButton>
      <Menu
        id="simple-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        <MenuItem onClick={handleClose}>Sök med objekt</MenuItem>
        <MenuItem onClick={handleClose}>Sök med polygon</MenuItem>
        <MenuItem onClick={handleClose}>Sök med radie</MenuItem>
        <MenuItem onClick={handleClose}>Sök i området</MenuItem>
        <MenuItem onClick={handleClose}>Inställningar</MenuItem>
      </Menu>
    </div>
  );
};

export default SearchTools;
