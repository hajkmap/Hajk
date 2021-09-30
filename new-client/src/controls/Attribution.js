import React from "react";
import withStyles from "@mui/styles/withStyles";
import { Attribution } from "ol/control";

const styles = (theme) => {
  return {
    attributions: {
      "& .ol-control": {
        position: "static",
        maxWidth: "none",
      },
      "& .ol-attribution": {
        background: theme.palette.background.paper,
        boxShadow: theme.shadows[4],
        borderRadius: theme.shape.borderRadius,
        height: "25px",
        overflow: "auto",
        whiteSpace: "nowrap",
        [theme.breakpoints.down("sm")]: {
          maxWidth: "100px",
        },
      },
      "& .ol-attribution ul": {
        color: "unset",
        textShadow: "unset",
      },
      "& button": {
        cursor: "pointer",
        boxShadow: "none",
        outline: "none",
      },
    },
  };
};

class AttributionControl extends React.PureComponent {
  constructor(props) {
    super(props);
    this.ref = React.createRef();
  }

  componentDidUpdate() {
    // Go on only if map exists AND we haven't done this yet.
    // Without the children.length part, we'd do this all the
    // time as we're inside componentDidUpdate.
    if (this.props.map && this.ref.current.children.length === 0) {
      const attributionControl = new Attribution({
        target: this.ref.current,
        tipLabel: "Visa/dölj copyrightinformation för kartdata",
        label: "©",
      });
      this.props.map.addControl(attributionControl);
    }
  }

  render() {
    const { classes } = this.props;
    return <div ref={this.ref} className={classes.attributions} />;
  }
}

export default withStyles(styles)(AttributionControl);
