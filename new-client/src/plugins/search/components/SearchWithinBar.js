import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import Chip from "@material-ui/core/Chip";
import CropSquare from "@material-ui/icons/CropSquare";

const styles = theme => ({
  chip: {
    margin: theme.spacing.unit,
    minWidth: 200
  }
});

function handleDelete() {
  alert("You clicked the delete icon."); // eslint-disable-line no-alert
}

function handleClick() {
  alert("You clicked the Chip."); // eslint-disable-line no-alert
}

function SearchWithinBar(props) {
  const { classes } = props;
  return (
    <Chip
      icon={<CropSquare />}
      label="Rita polygon"
      onClick={handleClick}
      className={classes.chip}
    />
  );
}

SearchWithinBar.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(SearchWithinBar);
