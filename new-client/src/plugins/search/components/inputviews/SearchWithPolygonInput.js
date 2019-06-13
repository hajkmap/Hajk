import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import Chip from "@material-ui/core/Chip";
import Edit from "@material-ui/icons/Edit";

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
    width: "inherit"
  }
});
/*
function handleDelete() {
  alert("You clicked the delete icon."); // eslint-disable-line no-alert
}

function handleClick() {
  alert("You clicked the Chip."); // eslint-disable-line no-alert
}*/

class SearchWithPolygonInput extends React.PureComponent {
  state = {
    polygonDrawn: false
  };
  componentDidMount() {
    const { model, onSearchDone, localObserver } = this.props;
    localObserver.publish("toolchanged");
    console.log("HERE");

    model.polygonSearch(
      () => {
        this.setState({ polygonDrawn: true });
      },
      featureCollections => {
        onSearchDone(featureCollections);
      }
    );
  }
  render() {
    const { classes } = this.props;
    return (
      <Chip
        icon={<Edit />}
        label={
          this.state.polygonDrawn ? "Ritat område: 1" : "Rita objekt i kartan" //Number of objects should be dynamic when implementing multidraw
        }
        //onClick={handleClick}
        className={classes.chip}
      />
    );
  }
}

SearchWithPolygonInput.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(SearchWithPolygonInput);
