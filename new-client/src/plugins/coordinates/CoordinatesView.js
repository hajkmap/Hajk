import React from "react";
import { withStyles } from "@material-ui/core/styles";

const styles = theme => ({
  text: {
    "& .ol-mouse-position": {
      top: "unset",
      right: "unset",
      position: "unset"
    }
  }
});

class CoordinatesView extends React.PureComponent {
  render() {
    const { classes } = this.props;
    return <div id="coordinatesContainer" className={classes.text}></div>;
  }
}

export default withStyles(styles)(CoordinatesView);
