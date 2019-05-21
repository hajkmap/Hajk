import React from "react";
import { withStyles } from "@material-ui/core/styles";
import IconButton from "@material-ui/core/IconButton";
import Settings from "@material-ui/icons/Settings";

const styles = theme => {
  return {
    button: {
      margin: "4px"
    }
  };
};

class SearchSettingsButton extends React.Component {
  state = {
    active: false
  };

  render() {
    const { classes } = this.props;
    return (
      <IconButton onClick={console.log("??")}>
        <Settings />
      </IconButton>
    );
  }
}

export default withStyles(styles)(SearchSettingsButton);
