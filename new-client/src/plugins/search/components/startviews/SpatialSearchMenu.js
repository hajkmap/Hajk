import React from "react";
import PropTypes from "prop-types";
import Typography from "@material-ui/core/Typography";
import { withStyles } from "@material-ui/core/styles";
import MenuItem from "@material-ui/core/MenuItem";
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

const POLYGON = "polygon";
const RADIUS = "radius";
const SELECTION = "selection";

class SpatialSearchOptions extends React.Component {
  state = {
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

  handleClose = e => {
    this.setState({ anchorEl: null });
  };

  renderMenu(anchorEl, open, activeSpatialTools) {
    let menuItems = [];
    if (activeSpatialTools) {
      if (activeSpatialTools.polygonSearch) {
        menuItems.push(this.renderMenuItem(POLYGON, <CropSquare />, "Rita"));
      }
      if (activeSpatialTools.radiusSearch) {
        menuItems.push(this.renderMenuItem(RADIUS, <TripOrigin />, "Radie"));
      }
      if (activeSpatialTools.selectionSearch) {
        menuItems.push(this.renderMenuItem(SELECTION, <TouchApp />, "Markera"));
      }
    }

    return (
      <Menu
        id="menu"
        anchorEl={anchorEl}
        getContentAnchorEl={null}
        open={open}
        onClose={this.handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        {menuItems.map(menuItem => {
          return menuItem;
        })}
      </Menu>
    );
  }

  renderMenuItem(spatialType, icon, text) {
    return (
      <MenuItem
        key={spatialType}
        onClick={() => this.handleMenuItemClick(spatialType)}
        value={spatialType}
        alignItems="center"
      >
        <Grid container direction="row" alignItems="center">
          <Grid item>{icon}</Grid>
          <Grid item />
          <Typography variant="subtitle1" gutterBottom>
            {text}
          </Typography>
        </Grid>
      </MenuItem>
    );
  }

  render() {
    const { classes, activeSpatialTools } = this.props;
    const { anchorEl } = this.state;
    const open = Boolean(anchorEl);

    return (
      <div className={classes.root}>
        <IconButton
          aria-label="More"
          aria-owns={open ? "menu" : undefined}
          aria-haspopup="true"
          onClick={this.handleDropdownClick}
        >
          <CropSquare />
          <ArrowDownward style={{ fontSize: 10 }} />
        </IconButton>
        {this.renderMenu(anchorEl, open, activeSpatialTools)}
      </div>
    );
  }
}

SpatialSearchOptions.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles, { withTheme: true })(SpatialSearchOptions);
