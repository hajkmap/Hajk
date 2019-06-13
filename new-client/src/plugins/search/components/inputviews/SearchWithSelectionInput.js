import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import Chip from "@material-ui/core/Chip";
import AddCircleOutline from "@material-ui/icons/AddCircleOutline";

const styles = theme => ({
  chip: {
    backgroundColor: "inherit",
    "&:hover": {
      backgroundColor: "transparent"
    },
    "&:focus": {
      backgroundColor: "transparent"
    },
    margin: theme.spacing.unit,
    minWidth: 200
  }
});
/*
function handleDelete() {
  alert("You clicked the delete icon."); // eslint-disable-line no-alert
}

function handleClick() {
  alert("You clicked the Chip."); // eslint-disable-line no-alert
}*/

class SearchWithSelectionInput extends React.PureComponent {
  state = {
    selectionDone: false
  };
  componentDidMount() {
    const { model, onSearchDone, localObserver } = this.props;
    localObserver.publish("toolchanged");
    model.selectionSearch(() => {
      this.setState({ selectionDone: true });
    }, onSearchDone);
  }
  render() {
    const { classes } = this.props;
    return (
      <Chip
        icon={<AddCircleOutline />}
        label={
          this.state.selectionDone
            ? "Markerat område : 1"
            : "Markera objekt i kartan"
        } //Number of objects should be dynamic when implementing multidraw
        //onClick={handleClick}
        className={classes.chip}
      />
    );
  }
}

SearchWithSelectionInput.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(SearchWithSelectionInput);
