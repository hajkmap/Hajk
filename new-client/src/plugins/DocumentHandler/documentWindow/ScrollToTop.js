import React from "react";
import Fab from "@material-ui/core/Fab";
import NavigationIcon from "@material-ui/icons/Navigation";
import { makeStyles } from "@material-ui/core/styles";
import { Typography } from "@material-ui/core";
import clsx from "clsx";
import { darken } from "@material-ui/core/styles";

const useStyles = ({ color }) =>
  makeStyles((theme) => ({
    scrollToTopButton: {
      position: "fixed",
      bottom: theme.spacing(2),
      right: theme.spacing(3),
    },
    customColor: color && {
      backgroundColor: color,
      color: theme.palette.getContrastText(color),
      "&:hover": {
        backgroundColor: darken(color, 0.3),
      },
    },
  }));

const ScrollToTop = ({ onClick, color }) => {
  const styleProps = { color };
  const { scrollToTopButton, customColor } = useStyles(styleProps)();

  return (
    <Fab
      size="small"
      className={clsx(scrollToTopButton, {
        [customColor]: color,
      })}
      color={color ? "default" : "primary"}
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
