import React from "react";
import OutlinedInput from "@material-ui/core/OutlinedInput";
import { withStyles } from "@material-ui/core/styles";
import ClearIcon from "@material-ui/icons/Clear";
import InputAdornment from "@material-ui/core/InputAdornment";
import SearchButton from "../../components/shared/SearchButton";

const styles = theme => ({
  search: {
    borderRadius: theme.shape.borderRadius,
    flex: "auto",
    display: "flex"
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
  }
});

class SearchWithTextInput extends React.PureComponent {
  state = {
    value: ""
  };

  componentDidMount() {
    const { localObserver } = this.props;
    localObserver.publish("searchToolChanged");
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
      resetToStartView
    } = this.props;

    return (
      <div className={classes.search}>
        <OutlinedInput
          autoComplete="off"
          inputRef={input => {
            this.input = input;
          }}
          onChange={e => {
            onChange(e.target.value, false, data => {
              if (data) {
                onComplete(data);
              }
            });
            this.setState({
              value: e.target.value
            });
          }}
          autoFocus={true}
          value={value === "" ? value : this.state.value}
          placeholder={"Sök"}
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
              <ClearIcon
                className={classes.clearIcon}
                onClick={() => {
                  resetToStartView();
                }}
              />
            </InputAdornment>
          }
        />
        <SearchButton
          onClick={() => {
            forceSearch(this.state.value, true, data => {
              onComplete(data);
            });
          }}
        />
      </div>
    );
  }
}

export default withStyles(styles)(SearchWithTextInput);
