import React from "react";
import { withStyles } from "@material-ui/core/styles";
import IconButton from "@material-ui/core/IconButton";
import Settings from "@material-ui/icons/Settings";

const styles = theme => {};

class SearchSettingsButton extends React.Component {
  state = {
    active: false
  };

  render() {
    return (
      <IconButton onClick={console.log("Not implemented")}>
        <Settings />
      </IconButton>
    );
  }
}

export default withStyles(styles)(SearchSettingsButton);
