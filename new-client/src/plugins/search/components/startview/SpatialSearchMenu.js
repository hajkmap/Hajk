import React from "react";
import PropTypes from "prop-types";
import Typography from "@material-ui/core/Typography";
import { withStyles } from "@material-ui/core/styles";
import MenuItem from "@material-ui/core/MenuItem";
import Edit from "@material-ui/icons/Edit";
import AddCircleOutline from "@material-ui/icons/AddCircleOutline";
import ArrowDropDown from "@material-ui/icons/ArrowDropDown";
import ArrowDropUp from "@material-ui/icons/ArrowDropUp";
import Grid from "@material-ui/core/Grid";
import RadioButtonUnchecked from "@material-ui/icons/RadioButtonUnchecked";
import IconButton from "@material-ui/core/IconButton";
import Menu from "@material-ui/core/Menu";

const styles = theme => ({
  root: {
    display: "flex",
    flexWrap: "wrap",
    borderLeft: "1px solid rgba(0, 0, 0, 0.42)"
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
        menuItems.push(this.renderMenuItem(POLYGON, <Edit />, "Rita"));
      }
      if (activeSpatialTools.radiusSearch) {
        menuItems.push(
          this.renderMenuItem(RADIUS, <RadioButtonUnchecked />, "Radie")
        );
      }
      if (activeSpatialTools.selectionSearch) {
        menuItems.push(
          this.renderMenuItem(SELECTION, <AddCircleOutline />, "Markera")
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
    const activeTools =
      activeSpatialTools.polygonSearch ||
      activeSpatialTools.selectionSearch ||
      activeSpatialTools.radiusSearch;

    if (activeTools) {
      return (
        <div className={classes.root}>
          <IconButton
            aria-label="More"
            aria-owns={open ? "menu" : undefined}
            aria-haspopup="true"
            onClick={this.handleDropdownClick}
          >
            {open ? <ArrowDropUp /> : <ArrowDropDown />}
          </IconButton>
          {this.renderMenu(anchorEl, open, activeSpatialTools)}
        </div>
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
