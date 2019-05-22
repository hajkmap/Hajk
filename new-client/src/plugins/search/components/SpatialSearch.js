import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import Typography from "@material-ui/core/Typography";
import { withStyles } from "@material-ui/core/styles";
import MenuItem from "@material-ui/core/MenuItem";
import Tooltip from "@material-ui/core/Tooltip";
import CropSquare from "@material-ui/icons/CropSquare";
import TripOrigin from "@material-ui/icons/TripOrigin";
import Grid from "@material-ui/core/Grid";
import TouchApp from "@material-ui/icons/TouchApp";
import IconButton from "@material-ui/core/IconButton";
import Menu from "@material-ui/core/Menu";

import ArrowDownward from "@material-ui/icons/ArrowDownward";
const styles = theme => ({
  root: {
    display: "flex",
    flexWrap: "wrap",
    borderLeft: "1px solid rgba(0, 0, 0, 0.42)"
  },
  anchorOriginBottomCenter: {
    bottom: "60px"
  },

  formControl: {
    margin: theme.spacing.unit,
    minWidth: 20,
    maxWidth: 300
  },
  noLabel: {
    marginTop: theme.spacing.unit * 3
  }
});
const ITEM_HEIGHT = 48;
const POLYGON = "polygon";
const WITHIN = "within";
const SELECTION = "selection";

class SpatialSearchOptions extends React.Component {
  state = {
    activeTool: "",
    anchorEl: null
  };

  handleMenuItemClick = toolTypeActive => {
    this.props.onToolChanged(toolTypeActive);
    this.setState({
      anchorEl: null,
      toolTypeActive: toolTypeActive
    });
  };

  handleDropdownClick = event => {
    this.setState({
      anchorEl: event.currentTarget
    });
  };

  handleClose = toolTypeActive => {
    this.setState({ anchorEl: null });
  };

  render() {
    const { classes } = this.props;
    const { anchorEl } = this.state;
    const open = Boolean(anchorEl);

    return (
      <div className={classes.root}>
        <IconButton
          aria-label="More"
          aria-owns={open ? "long-menu" : undefined}
          aria-haspopup="true"
          onClick={this.handleDropdownClick}
        >
          <CropSquare />
          <ArrowDownward style={{ fontSize: 10 }} />
        </IconButton>
        <Menu
          id="long-menu"
          anchorEl={anchorEl}
          getContentAnchorEl={null}
          open={open}
          onClose={this.handleClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          PaperProps={{
            style: {
              maxHeight: ITEM_HEIGHT * 4.5,
              width: 200
            }
          }}
        >
          <MenuItem
            onClick={() => this.handleMenuItemClick(WITHIN)}
            value={WITHIN}
            alignItems="center"
          >
            <Grid container direction="row" alignItems="center">
              <Grid item>
                <TripOrigin />
              </Grid>
              <Grid item />
              <Typography variant="subtitle1" gutterBottom>
                Rita
              </Typography>
            </Grid>
          </MenuItem>
          <MenuItem
            value={POLYGON}
            onClick={() => this.handleMenuItemClick(POLYGON)}
            alignItems="center"
          >
            <Grid container direction="row" alignItems="center">
              <Grid item>
                <CropSquare />
              </Grid>
              <Grid item />
              <Typography variant="subtitle1" gutterBottom>
                Rita
              </Typography>
            </Grid>
          </MenuItem>
          <MenuItem
            value={SELECTION}
            onClick={() => this.handleMenuItemClick(SELECTION)}
            alignItems="center"
          >
            <Grid container direction="row" alignItems="center">
              <Grid item>
                <TouchApp />
              </Grid>
              <Grid item />
              <Typography variant="subtitle1" gutterBottom>
                Markera
              </Typography>
            </Grid>
          </MenuItem>
        </Menu>
      </div>
    );
  }
}

SpatialSearchOptions.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles, { withTheme: true })(SpatialSearchOptions);
