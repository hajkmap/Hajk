import React from "react";
import { Button, Paper, Tooltip } from "@material-ui/core";
import HomeIcon from "@material-ui/icons/Home";

import { withStyles } from "@material-ui/core/styles";

const styles = theme => ({
  paper: {
    marginBottom: theme.spacing(1)
  },
  button: {
    minWidth: "unset"
  }
});

/**
 * @summary Resets map to initial zoom level, centrum coordinate and active layers.
 *
 * @param {object} props
 * @returns {object} React
 */
class MapResetter extends React.PureComponent {
  // TODO: Also reset layers to default visibility!
  handleClick = e => {
    const { map } = this.props;
    if (map !== undefined) {
      const view = map.getView();
      const { zoom, center } = this.props.mapConfig.map;
      view.animate({ zoom, center });
    }
  };

  render() {
    const { classes } = this.props;

    return (
      <Tooltip title="Återställ kartan till startläget">
        <Paper className={classes.paper}>
          <Button
            aria-label="Återställ kartan till startläget"
            className={classes.button}
            onClick={this.handleClick}
          >
            <HomeIcon />
          </Button>
        </Paper>
      </Tooltip>
    );
  }
}

export default withStyles(styles)(MapResetter);
