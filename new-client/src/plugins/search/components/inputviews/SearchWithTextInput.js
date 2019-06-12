import React from "react";
import Input from "@material-ui/core/Input";
import { withStyles } from "@material-ui/core/styles";
import ClearIcon from "@material-ui/icons/Clear";
import InputAdornment from "@material-ui/core/InputAdornment";

const styles = theme => ({
  search: {
    borderRadius: theme.shape.borderRadius,
    flex: "auto"
  },
  clearIcon: {},
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

class SearchWithTextInput extends React.PureComponent {
  state = {
    value: ""
  };

  componentDidMount() {
    const { localObserver } = this.props;
    localObserver.publish("toolchanged");
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
      forceSearch,
      onClear
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
          autoFocus={true}
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
          endAdornment={
            <InputAdornment position="end">
              <ClearIcon className={classes.clearIcon} onClick={onClear} />
            </InputAdornment>
          }
        />
      </div>
    );
  }
}

export default withStyles(styles)(SearchWithTextInput);
