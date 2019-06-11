import React from "react";
import Input from "@material-ui/core/Input";
import { withStyles } from "@material-ui/core/styles";
import SearchIcon from "@material-ui/icons/Search";
import ClearIcon from "@material-ui/icons/Clear";
import InputAdornment from "@material-ui/core/InputAdornment";
import CircularProgress from "@material-ui/core/CircularProgress";

const styles = theme => ({
  search: {
    borderRadius: theme.shape.borderRadius,
    border: "1px solid " + theme.palette.primary.main
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
  },
  clearIcon: {
    cursor: "pointer"
  },
  searchIcon: {
    position: "relative",
    padding: "6px"
  },
  progress: {
    width: "20px !important",
    height: "20px !important",
    color: theme.palette.primary.main,
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
