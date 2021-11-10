import React from "react";
import { Avatar, Button, Paper, Tooltip } from "@material-ui/core";

import { makeStyles } from "@material-ui/styles";

const useStyles = makeStyles((theme) => ({
  paper: {
    marginBottom: theme.spacing(1),
  },
  button: {
    minWidth: "unset",
  },
  avatar: {
    width: 25,
    height: 25,
    fontSize: "0.8rem",
    backgroundColor: theme.palette.text.primary,
  },
}));

/**
 * @summary Transform a full name to initials, e.g. "John Smith" to "JS"
 *
 * @param {string} displayName
 * @returns {string} The initials from supplied string
 */
const getInitialsFromDisplayName = (displayName) => {
  return displayName
    .split(" ")
    .map((name) => name[0])
    .join("")
    .toUpperCase();
};

/**
 * @summary Compose a tooltip string by joining some user detail values
 *
 * @param {object} userDetails
 * @returns {string} Tooltip string value
 */
const getTooltipString = (userDetails) => {
  return `${userDetails.displayName}, ${userDetails.description}`;
};

/**
 * @summary A button that contains user's initials inside an Avatar component
 *
 * @param {object} props
 * @returns {object} React
 */
const User = React.memo(({ userDetails }) => {
  const classes = useStyles();

  return (
    (userDetails && (
      <Tooltip title={getTooltipString(userDetails)}>
        <Paper className={classes.paper}>
          <Button
            aria-label={userDetails.displayName}
            className={classes.button}
          >
            <Avatar alt={userDetails.displayName} className={classes.avatar}>
              {getInitialsFromDisplayName(userDetails.displayName)}
            </Avatar>
          </Button>
        </Paper>
      </Tooltip>
    )) ||
    null
  );
});

export default User;
