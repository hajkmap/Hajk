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

class SearchBarStart extends React.PureComponent {
  constructor(props) {
    super();
  }

  componentDidMount() {
    const { localObserver } = this.props;
    localObserver.publish("toolchanged");
  }

  render() {
    const { classes, onMouseEnter, target } = this.props;

    return (
      <div className={classes.search}>
        <Input
          autoComplete="off"
          onClick={onMouseEnter}
          placeholder={"Sök"}
          disableUnderline
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
      </div>
    );
  }
}

export default withStyles(styles)(SearchBarStart);
