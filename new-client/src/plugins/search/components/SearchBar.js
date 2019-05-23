import React from "react";
import Input from "@material-ui/core/Input";
import { withStyles } from "@material-ui/core/styles";
import SearchIcon from "@material-ui/icons/Search";
import InputAdornment from "@material-ui/core/InputAdornment";

const styles = theme => ({
  search: {
    borderRadius: theme.shape.borderRadius,
    flex: "auto"
  },
  inputRoot: {
    width: "100%"
  },
  inputInput: {
    padding: theme.spacing.unit,
    left: "100%",
    width: "100%"
  },
  inputInputWide: {
    padding: theme.spacing.unit,
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

  componentDidMount() {
    this.props.localObserver.publish("toolchanged");
  }

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
      forceSearch
    } = this.props;

    return (
      <div className={classes.search}>
        <Input
          autoComplete="off"
          onChange={e => {
            onChange(e.target.value, false, data => {
              onComplete(data);
            });
            this.setState({
              value: e.target.value
            });
          }}
          value={value === "" ? value : this.state.value}
          placeholder={"Sök"}
          disableUnderline
          onKeyPress={e => {
            //keyCode deprecated so using e.key instead
            if (e.key === "Enter") {
              forceSearch(e.target.value, true, data => {
                onComplete(data);
              });
            }
          }}
          classes={{
            root: classes.inputRoot,
            input:
              target === "top" ? classes.inputInputWide : classes.inputInput
          }}
          startAdornment={
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          }
        />
      </div>
    );
  }
}

export default withStyles(styles)(SearchBar);

/*endAdornment={
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
          }*/
