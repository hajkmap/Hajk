import React from "react";
import Fab from "@material-ui/core/Fab";
import NavigationIcon from "@material-ui/icons/Navigation";
import { makeStyles } from "@material-ui/core/styles";
import { Typography } from "@material-ui/core";

const useStyles = makeStyles((theme) => ({
  scrollToTopButton: {
    position: "fixed",
    bottom: theme.spacing(2),
    right: theme.spacing(3),
  },
}));

const ScrollToTop = ({ onClick }) => {
  const classes = useStyles();

  return (
    <Fab
      className={classes.scrollToTopButton}
      size="small"
      color="primary"
      onClick={onClick}
    >
      <Typography variant="srOnly">
        Scrolla till toppen av dokumentet
      </Typography>
      <NavigationIcon />
    </Fab>
  );
};

export default ScrollToTop;
