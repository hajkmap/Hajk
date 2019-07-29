import React from "react";
import { withStyles } from "@material-ui/core/styles";
import Zoom from "ol/control/Zoom";

const styles = theme => {
  return {
    zoom: {
      pointerEvents: "all",
      "& .ol-control": {
        position: "static"
      },
      "& button": {
        "&:focus": {
          background: "rgba(255, 255, 255, 1)"
        },
        "&:hover": {
          background: "rgba(255, 255, 255, 1)"
        },
        background: "rgba(255, 255, 255, 1)",
        boxShadow: theme.shadows[4],
        border: "1px solid rgba(255 ,255, 255, 0.5)",
        borderRadius: "2px",
        fontSize: "20pt",
        position: "static",
        cursor: "pointer",
        overflow: "hidden",
        margin: "5px",
        outline: "none",
        padding: 0
      }
    },
    icon: {
      padding: "5px"
    }
  };
};

class ZoomControl extends React.PureComponent {
  componentDidUpdate() {
    if (this.props.map) {
      const zoomControl = new Zoom({
        target: this.refs.zoom,
        zoomInTipLabel: "",
        zoomOutTipLabel: ""
      });
      this.props.map.addControl(zoomControl);
    }
  }

  render() {
    const { classes } = this.props;
    return <div ref="zoom" className={classes.zoom} />;
  }
}

export default withStyles(styles)(ZoomControl);
