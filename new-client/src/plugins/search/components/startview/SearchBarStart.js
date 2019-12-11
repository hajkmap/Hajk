import React from "react";
import OutlinedInput from "@material-ui/core/OutlinedInput";
import { withStyles } from "@material-ui/core/styles";
import SearchIcon from "@material-ui/icons/Search";
import InputAdornment from "@material-ui/core/InputAdornment";
import SpatialSearchMenu from "./SpatialSearchMenu";

const styles = theme => ({
  search: {
    borderRadius: theme.shape.borderRadius,
    flex: "auto",
    display: "flex",
    height: "100%"
  },
  inputRoot: {
    width: "100%"
  },
  inputInput: {
    padding: theme.spacing(1),
    left: "100%",
    width: "100%"
  },
  inputInputWide: {
    padding: theme.spacing(1),
    left: "100%",
    width: "100%",
    "&:focus": {
      width: "100%"
    }
  }
});

class SearchBarStart extends React.PureComponent {
  constructor(props) {
    super();
  }

  componentDidMount() {
    const { localObserver } = this.props;
    localObserver.publish("searchToolChanged");
  }

  renderSpatialSearchOptions() {
    const { activeSpatialTools } = this.props;
    return (
      <SpatialSearchMenu
        onToolChanged={this.props.onToolChanged}
        activeSpatialTools={activeSpatialTools}
      />
    );
  }

  render() {
    const { classes, onTextFieldClick, target } = this.props;

    return (
      <div className={classes.search}>
        <OutlinedInput
          autoComplete="off"
          onClick={onTextFieldClick}
          placeholder={"Sök"}
          classes={{
            root: classes.inputRoot,
            input:
              target === "top" ? classes.inputInputWide : classes.inputInput
          }}
          startAdornment={
            <InputAdornment position="start">
              <SearchIcon color="disabled" />
            </InputAdornment>
          }
        />

        {this.renderSpatialSearchOptions()}
      </div>
    );
  }
}

export default withStyles(styles)(SearchBarStart);
