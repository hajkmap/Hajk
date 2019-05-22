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

class SearchWithPolygonBar extends React.PureComponent {
  componentDidMount() {
    const { model, onSearchDone } = this.props;
    model.polygonSearch(featureCollections => {
      onSearchDone(featureCollections);
    });
  }
  render() {
    const { classes } = this.props;
    return (
      <Chip
        icon={<CropSquare />}
        label="Rita objekt i kartan"
        onClick={handleClick}
        className={classes.chip}
      />
    );
  }
}

SearchWithPolygonBar.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(SearchWithPolygonBar);
