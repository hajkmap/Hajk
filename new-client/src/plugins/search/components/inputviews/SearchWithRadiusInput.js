import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import Chip from "@material-ui/core/Chip";
import RadioButtonUnchecked from "@material-ui/icons/RadioButtonUnchecked";
import Snackbar from "@material-ui/core/Snackbar";
import { createPortal } from "react-dom";

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

class SearchWithRadiusInput extends React.PureComponent {
  state = {
    radiusDrawn: false
  };

  componentDidMount() {
    const { model, onSearchWithin, localObserver } = this.props;
    localObserver.publish("toolchanged");
    model.withinSearch(
      () => {
        this.setState({ radiusDrawn: true });
      },
      layerIds => {
        if (layerIds.length > 0) {
          onSearchWithin(layerIds);
        }
      }
    );
  }
  render() {
    const { classes } = this.props;
    return (
      <div>
        <Chip
          icon={<RadioButtonUnchecked />}
          label={
            this.state.radiusDrawn ? "Ritad radie: 1" : "Sök med radie i kartan"
          } //Number of objects should be dynamic when implementing multidraw
          //onClick={handleClick}
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

SearchWithRadiusInput.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(SearchWithRadiusInput);
