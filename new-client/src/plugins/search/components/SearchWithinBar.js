import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import Chip from "@material-ui/core/Chip";
import TripOrigin from "@material-ui/icons/TripOrigin";
import Snackbar from "@material-ui/core/Snackbar";
import { createPortal } from "react-dom";

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

class SearchWithinBar extends React.PureComponent {
  componentDidMount() {
    console.log("didMount");
    const { model, onSearchWithin } = this.props;
    model.withinSearch(layerIds => {
      if (layerIds.length > 0) {
        onSearchWithin(layerIds);
      }
    });
  }
  render() {
    const { classes } = this.props;
    return (
      <div>
        <Chip
          icon={<TripOrigin />}
          label="Sök med radie i kartan"
          onClick={handleClick}
          className={classes.chip}
        />
        {createPortal(
          <Snackbar
            className={classes.anchorOriginBottomCenter}
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            open={true}
            ContentProps={{
              "aria-describedby": "message-id"
            }}
            message={
              <span id="message-id">
                {"Dra ut en radie i kartan för att välja storlek på sökområde."}
              </span>
            }
          />,
          document.getElementById("map-overlay")
        )}
      </div>
    );
  }
}

SearchWithinBar.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(SearchWithinBar);
