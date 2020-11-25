import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { Attribution } from "ol/control";

const styles = theme => {
  return {
    attributions: {
      "& .ol-control": {
        position: "static",
        maxWidth: "none"
      },
      "& .ol-attribution": {
        background: theme.palette.background.paper,
        boxShadow: theme.shadows[4],
        borderRadius: theme.shape.borderRadius,

        height: "25px",
        overflow: "auto",
        whiteSpace: "nowrap",
        [theme.breakpoints.down("xs")]: {
          maxWidth: "100px"
        }
      },
      "& button": {
        cursor: "pointer",
        boxShadow: "none",
        outline: "none"
      }
    }
  };
};

class AttributionControl extends React.PureComponent {
  componentDidUpdate() {
    if (this.props.map) {
      const attributionControl = new Attribution({
        target: this.refs.attributions,
        tipLabel: "Visa/dölj copyrightinformation för kartdata",
        label: "©"
      });
      this.props.map.addControl(attributionControl);
    }
  }

  render() {
    const { classes } = this.props;
    return <div ref="attributions" className={classes.attributions} />;
  }
}

export default withStyles(styles)(AttributionControl);
