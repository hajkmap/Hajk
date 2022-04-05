import React from "react";
import { Button, Paper, Tooltip } from "@material-ui/core";
import Brightness4Icon from "@material-ui/icons/Brightness4";

import { makeStyles } from "@material-ui/styles";

const useStyles = makeStyles((theme) => ({
  paper: {
    marginBottom: theme.spacing(1),
  },
  button: {
    minWidth: "unset",
  },
}));

/**
 * @summary Hides all visible layers
 *
 * @param {object} props
 * @returns {object} React
 */
const ThemeToggler = React.memo((props) => {
  const classes = useStyles();

  return (
    props.showThemeToggler && (
      <Tooltip title="Växla mellan mörkt och ljust färgtema">
        <Paper className={classes.paper}>
          <Button
            aria-label="Växla färgtema"
            className={classes.button}
            onClick={(e) => {
              props.toggleMUITheme();
            }}
          >
            <Brightness4Icon />
          </Button>
        </Paper>
      </Tooltip>
    )
  );
});

export default ThemeToggler;
