import React from "react";
import Input from "@material-ui/core/Input";
import { withStyles } from "@material-ui/core/styles";
import SearchIcon from "@material-ui/icons/Search";
import InputAdornment from "@material-ui/core/InputAdornment";

const styles = theme => ({
  search: {
    borderRadius: theme.shape.borderRadius,

    backgroundColor: "inherit",

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
    const { classes, onChange, onComplete, value, target } = this.props;

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
          placeholder={"Sök"}
          disableUnderline
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
