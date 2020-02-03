import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import {
  Divider,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Typography
} from "@material-ui/core";

import EditIcon from "@material-ui/icons/Edit";
import AddCircleOutlineIcon from "@material-ui/icons/AddCircleOutline";
import MoreHorizIcon from "@material-ui/icons/MoreHoriz";
import RadioButtonUncheckedIcon from "@material-ui/icons/RadioButtonUnchecked";

const styles = theme => ({
  root: {
    display: "flex",
    flexWrap: "wrap",
    borderLeft: "1px solid rgba(0, 0, 0, 0.42)"
  },
  divider: {
    height: 28,
    margin: 4
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
        menuItems.push(this.renderMenuItem(POLYGON, <EditIcon />, "Rita"));
      }
      if (activeSpatialTools.radiusSearch) {
        menuItems.push(
          this.renderMenuItem(RADIUS, <RadioButtonUncheckedIcon />, "Radie")
        );
      }
      if (activeSpatialTools.selectionSearch) {
        menuItems.push(
          this.renderMenuItem(SELECTION, <AddCircleOutlineIcon />, "Markera")
        );
      }
    }

    return (
      <Menu
        id="menu"
        anchorEl={anchorEl}
        getContentAnchorEl={null}
        open={open}
        onClose={this.handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center"
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "center"
        }}
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
    const activeTools =
      activeSpatialTools.polygonSearch ||
      activeSpatialTools.selectionSearch ||
      activeSpatialTools.radiusSearch;

    if (activeTools) {
      return (
        // <div className={classes.root}>
        <>
          <Divider className={classes.divider} orientation="vertical" />
          <Tooltip title="Visa fler sökalternativ">
            <IconButton
              aria-label="MoreHoriz"
              aria-owns={open ? "menu" : undefined}
              aria-haspopup="true"
              color="primary"
              className={classes.iconButton}
              onClick={this.handleDropdownClick}
              id="spatialSearchMenu"
            >
              <MoreHorizIcon />
            </IconButton>
          </Tooltip>
          {this.renderMenu(anchorEl, open, activeSpatialTools)}
        </>
        // </div>
      );
    } else {
      return null;
    }
  }
}

SpatialSearchOptions.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles, { withTheme: true })(SpatialSearchOptions);
