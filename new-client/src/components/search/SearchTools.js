import React, { useState } from "react";
import IconButton from "@material-ui/core/IconButton";
import MoreHorizIcon from "@material-ui/icons/MoreHoriz";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import Typography from "@material-ui/core/Typography";
import AddCircleOutlineIcon from "@material-ui/icons/AddCircleOutline";
import EditIcon from "@material-ui/icons/Edit";
import RadioButtonUncheckedIcon from "@material-ui/icons/RadioButtonUnchecked";
import Settings from "@material-ui/icons/Settings";

import { createPortal } from "react-dom";
import Dialog from "../Dialog.js";

const options = [
  {
    name: "--- Välj verktyg ---",
    type: "POLYGON"
  },
  {
    name: "Sök med objekt",
    icon: <AddCircleOutlineIcon />,
    type: "SELECTION"
  },
  {
    name: "Sök med polygon",
    icon: <EditIcon />,
    type: "Polygon"
  },
  {
    name: "Sök med radie",
    icon: <RadioButtonUncheckedIcon />,
    type: "Circle"
  },
  {
    name: "Sök i området",
    icon: <AddCircleOutlineIcon />,
    type: "POLYGON"
  },
  {
    name: "Inställningar",
    icon: <Settings />,
    type: "SETTINGS"
  }
];

const SearchTools = props => {
  const [anchorEl, setAnchorEl] = React.useState(null);

  // Settings dialog
  const [settingsDialog, setSettingsDialog] = useState(false);

  const handleOpenMenu = event => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuItemClick = (event, index, option) => {
    const type = option.type;
    setAnchorEl(null);

    if (type === "SETTINGS") {
      setSettingsDialog(true);
    } else {
      props.toggleDraw(true, type);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  function renderSettingsDialog() {
    if (settingsDialog) {
      return createPortal(
        <Dialog
          options={{
            text: "Avancerade inställningar...",
            headerText: "Inställningar",
            buttonText: "OK"
          }}
          open={settingsDialog}
          onClose={() => {
            setSettingsDialog(false);
          }}
        />,
        document.getElementById("windows-container")
      );
    } else {
      return null;
    }
  }

  return (
    <div>
      {renderSettingsDialog()}
      <IconButton
        aria-haspopup="true"
        aria-controls="lock-menu"
        onClick={handleOpenMenu}
      >
        <MoreHorizIcon />
      </IconButton>
      <Menu
        id="lock-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        {options.map((option, index) => (
          <MenuItem
            key={index}
            disabled={index === 0 || index === 1 || index === 3 || index === 4}
            onClick={event => handleMenuItemClick(event, index, option)}
          >
            {option.icon ? <ListItemIcon>{option.icon}</ListItemIcon> : null}
            <Typography variant="inherit" noWrap>
              {option.name}
            </Typography>
          </MenuItem>
        ))}
      </Menu>
    </div>
  );
};

export default SearchTools;
