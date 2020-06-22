import React, { useEffect, useState } from "react";

import { makeStyles } from "@material-ui/core/styles";

import ToggleButton from "@material-ui/lab/ToggleButton";
import ToggleButtonGroup from "@material-ui/lab/ToggleButtonGroup";

import CloseIcon from "@material-ui/icons/Close";
import { Paper, Hidden } from "@material-ui/core";

const useStyles = makeStyles(theme => ({
  root: {
    marginRight: theme.spacing(1),
    [theme.breakpoints.down("xs")]: {
      boxShadow: "none"
    }
  },
  icon: {
    [theme.breakpoints.up("md")]: {
      marginRight: theme.spacing(1)
    }
  },
  grouped: {
    [theme.breakpoints.down("xs")]: {
      border: "none"
    }
  }
}));

function DrawerToggleButtons({ drawerButtons, globalObserver }) {
  const classes = useStyles();

  // If cookie for drawerPermanent is true, get the last active
  // content and set as active toggle button.
  const [activeButton, setActiveButton] = useState(
    window.localStorage.getItem("drawerPermanent") === "true" &&
      window.localStorage.getItem("activeDrawerContent") !== null
      ? window.localStorage.getItem("activeDrawerContent")
      : null
  );

  // Sort by the (optional) @order property prior rendering
  drawerButtons = drawerButtons.sort((a, b) => a?.order > b?.order);

  // Subscribe only once, important that it's done inside useEffect!
  useEffect(() => {
    globalObserver.subscribe("core.unsetActiveButton", () => {
      setActiveButton(null);
    });
  }, [globalObserver]);

  const handleClickOnToggleButton = (e, v) => {
    setActiveButton(v);

    if (v === null) {
      window.localStorage.removeItem("activeDrawerContent");
    } else {
      window.localStorage.setItem("activeDrawerContent", v);
    }

    // Let the outside world know that a button has been pressed.
    // App will handle changing context. v=null is valid too.
    globalObserver.publish("core.drawerContentChanged", v);
  };

  const renderToggleButton = ({ ButtonIcon, value, caption }) => {
    // Currently active toggle button should have a "Close" icon
    const icon =
      value === activeButton ? (
        <CloseIcon className={classes.icon} />
      ) : (
        <ButtonIcon className={classes.icon} />
      );

    // Caption should be hidden on small screens
    return (
      <ToggleButton key={value} value={value}>
        {icon}
        <Hidden smDown>{caption}</Hidden>
      </ToggleButton>
    );
  };

  return (
    drawerButtons.length > 0 && (
      <Paper className={classes.root}>
        <ToggleButtonGroup
          value={activeButton}
          exclusive
          onChange={handleClickOnToggleButton}
          aria-label="Drawer content"
          classes={{ grouped: classes.grouped }}
        >
          {drawerButtons.map(b => renderToggleButton(b))}
        </ToggleButtonGroup>
      </Paper>
    )
  );
}

function arePropsEqual(prevProps, nextProps) {
  // Only re-render if drawerButtons have changed since last render
  return prevProps.drawerButtons.length === nextProps.drawerButtons.length;
}

export default React.memo(DrawerToggleButtons, arePropsEqual);
