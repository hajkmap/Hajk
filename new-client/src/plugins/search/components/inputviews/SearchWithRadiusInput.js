import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import RadioButtonUnchecked from "@material-ui/icons/RadioButtonUnchecked";
import Snackbar from "@material-ui/core/Snackbar";
import { createPortal } from "react-dom";
import SearchButton from "../../components/SearchButton";
import InputAdornment from "@material-ui/core/InputAdornment";
import ClearIcon from "@material-ui/icons/Clear";
import { OutlinedInput } from "@material-ui/core";

const styles = theme => ({
  clearIcon: {
    cursor: "pointer"
  },
  input: {
    flex: "auto"
  }
});

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
    return (
      <div style={{ display: "flex", flex: "auto" }}>
        {this.renderInput()}
        <SearchButton />
      </div>
    );
  }

  renderInput() {
    const { classes, resetToStartView } = this.props;
    if (this.state.radiusDrawn) {
      this.input.blur();
    }
    return (
      <div style={{ display: "flex", flex: "auto" }}>
        <OutlinedInput
          className={classes.input}
          autoComplete="off"
          autoFocus
          readOnly
          inputRef={input => {
            this.input = input;
          }}
          value={
            this.state.radiusDrawn ? "Ritad radie: 1" : "Sök med radie i kartan"
          }
          startAdornment={
            <InputAdornment position="start">
              <RadioButtonUnchecked />
            </InputAdornment>
          }
          endAdornment={
            <InputAdornment position="end">
              <ClearIcon
                className={classes.clearIcon}
                onClick={() => {
                  resetToStartView();
                }}
              />
            </InputAdornment>
          }
        />

        <div />
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
