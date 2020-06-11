import React, { useState } from "react";

import { makeStyles } from "@material-ui/core/styles";

import ToggleButton from "@material-ui/lab/ToggleButton";
import ToggleButtonGroup from "@material-ui/lab/ToggleButtonGroup";

import CloseIcon from "@material-ui/icons/Close";
import { Paper, Hidden } from "@material-ui/core";

const useStyles = makeStyles(theme => ({
  root: {
    marginRight: theme.spacing(1)
  },
  icon: {
    [theme.breakpoints.up("md")]: {
      marginRight: theme.spacing(1)
    }
  }
}));

function DrawerToggleButtons({ drawerButtons, globalObserver }) {
  const classes = useStyles();

  const [activeButton, setActiveButton] = useState(null);

  const handleToggleButton = (e, v) => {
    console.log("Button pressed with value: ", v);
    // Only set active toggle button if Drawer is permanently visible
    // drawerPermanent && setActiveButton(v);
    setActiveButton(v);

    // Regardless of Drawer permanent state,
    // let the outside world know that a button has been pressed.
    // App will handle changing context. v=null is valid too.
    globalObserver.publish("core.drawerContent", v);
  };

  globalObserver.subscribe("core.hideDrawer", () => {
    console.log(
      "Something tells Drawer Buttons that Drawer is hidden, unsetting active button"
    );
    setActiveButton(null);
  });

  // Sort by the (optional) order property prior rendering
  drawerButtons = drawerButtons.sort((a, b) => a?.order > b?.order);

  const renderToggleButton = ({ ButtonIcon, value, caption }) => {
    const icon =
      value === activeButton ? (
        <CloseIcon className={classes.icon} />
      ) : (
        <ButtonIcon className={classes.icon} />
      );

    return (
      <ToggleButton key={value} value={value}>
        {icon}
        <Hidden smDown>{caption}</Hidden>
      </ToggleButton>
    );
  };

  return (
    <Paper className={classes.root}>
      <ToggleButtonGroup
        value={activeButton}
        exclusive
        onChange={handleToggleButton}
        aria-label="Drawer content"
      >
        {drawerButtons.map(b => renderToggleButton(b))}
      </ToggleButtonGroup>
    </Paper>
  );
}

export default React.memo(DrawerToggleButtons);
