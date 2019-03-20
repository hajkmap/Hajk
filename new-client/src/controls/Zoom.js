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
        fontSize: "20pt",
        position: "static",
        cursor: "pointer",
        background: "rgba(255, 255, 255, 1)",
        border: "1px solid rgba(255 ,255, 255, 0.5)",
        boxShadow:
          "0px 2px 4px -1px rgba(0,0,0,0.2), 0px 4px 5px 0px rgba(0,0,0,0.14), 0px 1px 10px 0px rgba(0,0,0,0.12)",
        borderRadius: "2px",
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
