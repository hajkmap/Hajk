import React, { useState } from "react";

import { makeStyles } from "@material-ui/core/styles";

import ToggleButton from "@material-ui/lab/ToggleButton";
import ToggleButtonGroup from "@material-ui/lab/ToggleButtonGroup";

import CloseIcon from "@material-ui/icons/Close";
import { Paper } from "@material-ui/core";

const useStyles = makeStyles(theme => ({
  root: {
    marginRight: theme.spacing(1)
  },
  icon: {
    marginRight: theme.spacing(1)
  }
}));

function DrawerToggleButtons({ drawerButtons, globalObserver }) {
  const classes = useStyles();

  const [activeButton, setActiveButton] = useState("plugins");

  const handleToggleButton = (e, v) => {
    console.log("Toggle to: ", v);
    setActiveButton(v);
    globalObserver.publish("core.drawerContent", v);
  };

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
        {icon} {caption}
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
