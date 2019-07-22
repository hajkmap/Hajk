import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { ScaleLine } from "ol/control";

const styles = theme => {
  return {
    scaleLine: {
      "& .ol-scale-line": {
        position: "fixed",
        right: "0",
        bottom: "0",
        background: theme.palette.background.paper,
        boxShadow: theme.shadows[4],
        border: "1px solid rgba(255 ,255, 255, 0.5)",
        borderRadius: "2px",
        margin: "0 10px 5px 0"
      },
      "& .ol-scale-line-inner": {
        borderColor: theme.palette.text.primary,
        color: theme.palette.text.primary,
        fontSize: "0.7em",
        lineHeight: "1.5em"
      }
    }
  };
};

class ScaleLineControl extends React.PureComponent {
  componentDidUpdate() {
    if (this.props.map) {
      const scaleLineControl = new ScaleLine({ target: this.refs.scaleLine });
      this.props.map.addControl(scaleLineControl);
    }
  }

  render() {
    const { classes } = this.props;
    return <div ref="scaleLine" className={classes.scaleLine} />;
  }
}

export default withStyles(styles)(ScaleLineControl);
