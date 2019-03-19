import React from "react";
import Input from "@material-ui/core/Input";
import { withStyles } from "@material-ui/core/styles";
import { fade } from "@material-ui/core/styles/colorManipulator";
import SearchIcon from "@material-ui/icons/Search";
import ClearIcon from "@material-ui/icons/Clear";
import InputAdornment from "@material-ui/core/InputAdornment";
import CircularProgress from "@material-ui/core/CircularProgress";

const styles = theme => ({
  search: {
    borderRadius: theme.shape.borderRadius,
    border: "1px solid " + theme.palette.secondary.main,
    backgroundColor: fade(theme.palette.common.white, 0.15),
    "&:hover": {
      backgroundColor: fade(theme.palette.common.white, 0.25)
    },
    overflow: "hidden"
  },
  closeIcon: {},
  clearIcon: {
    cursor: "pointer"
  },
  searchIcon: {
    height: "100%",
    position: "relative",
    padding: "6px",
    background: theme.palette.secondary.main
  },
  inputRoot: {
    color: "inherit",
    width: "100%"
  },
  inputInput: {
    paddingTop: theme.spacing.unit,
    paddingRight: theme.spacing.unit,
    paddingBottom: theme.spacing.unit,
    paddingLeft: theme.spacing.unit,
    transition: theme.transitions.create("width"),
    left: "100%",
    width: "100%"
  },
  inputInputWide: {
    paddingTop: theme.spacing.unit,
    paddingRight: theme.spacing.unit,
    paddingBottom: theme.spacing.unit,
    paddingLeft: theme.spacing.unit,
    transition: theme.transitions.create("width"),
    left: "100%",
    width: "100%",
    "&:focus": {
      width: "100%"
    }
  },
  progress: {
    width: "20px !important",
    height: "20px !important",
    color: "black",
    margin: "2px"
  }
});

class SearchBar extends React.PureComponent {
  state = {
    value: ""
  };

  constructor(props) {
    super();
    props.model.observer.subscribe("clearInput", () => {
      this.setState({
        value: ""
      });
    });
  }

  render() {
    const {
      classes,
      onChange,
      onComplete,
      value,
      target,
      loading,
      tooltip
    } = this.props;

    return (
      <div className={classes.search}>
        <Input
          autoComplete="off"
          onChange={e => {
            onChange(e.target.value, data => {
              onComplete(data);
            });
            this.setState({
              value: e.target.value
            });
          }}
          value={value === "" ? value : this.state.value}
          placeholder={tooltip}
          disableUnderline
          classes={{
            root: classes.inputRoot,
            input:
              target === "top" ? classes.inputInputWide : classes.inputInput
          }}
          endAdornment={
            <InputAdornment className={classes.searchIcon} position="end">
              {this.state.value ? (
                loading ? (
                  <CircularProgress className={classes.progress} />
                ) : (
                  <ClearIcon
                    onClick={this.props.onClear}
                    className={classes.clearIcon}
                  />
                )
              ) : (
                <SearchIcon />
              )}
            </InputAdornment>
          }
        />
      </div>
    );
  }
}

export default withStyles(styles)(SearchBar);
