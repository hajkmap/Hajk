import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import Typography from "@material-ui/core/Typography";
import { withStyles } from "@material-ui/core/styles";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import Select from "@material-ui/core/Select";
import Tooltip from "@material-ui/core/Tooltip";
import CropSquare from "@material-ui/icons/CropSquare";
import TripOrigin from "@material-ui/icons/TripOrigin";
import Stop from "@material-ui/icons/Stop";
import Grid from "@material-ui/core/Grid";
import Icon from "@material-ui/core/Icon";
import TouchApp from "@material-ui/icons/TouchApp";
import { createPortal } from "react-dom";
import Snackbar from "@material-ui/core/Snackbar";
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
const names = ["Polygon", "Radie", "Välj"];

class SpatialSearchOptions extends React.Component {
  state = {
    activeTool: "",
    anchorEl: null
  };

  handleClick = event => {
    this.setState({ anchorEl: event.currentTarget });
  };

  handleClose = () => {
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
          onClick={this.handleClick}
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
            onClick={this.handleClose}
            value={"polygon"}
            alignItems="center"
          >
            <Tooltip title="Visa påverkan inom ett område">
              <Grid container direction="row" alignItems="center">
                <Grid item>
                  <TripOrigin />
                </Grid>
                <Grid item />
                <Typography variant="subtitle1" gutterBottom>
                  Rita
                </Typography>
              </Grid>
            </Tooltip>
          </MenuItem>
          <MenuItem value={"selection"} alignItems="center">
            <Tooltip title="Visa påverkan inom ett område">
              <Grid container direction="row" alignItems="center">
                <Grid item>
                  <CropSquare />
                </Grid>
                <Grid item />
                <Typography variant="subtitle1" gutterBottom>
                  Rita
                </Typography>
              </Grid>
            </Tooltip>
          </MenuItem>
          <MenuItem value={"within"} alignItems="center">
            <Tooltip title="Visa påverkan inom ett område">
              <Grid container direction="row" alignItems="center">
                <Grid item>
                  <TouchApp />
                </Grid>
                <Grid item />
                <Typography variant="subtitle1" gutterBottom>
                  Markera
                </Typography>
              </Grid>
            </Tooltip>
          </MenuItem>
        </Menu>

        {createPortal(
          <Snackbar
            className={classes.anchorOriginBottomCenter}
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            open={true /*this.state.active ? true : false*/}
            ContentProps={{
              "aria-describedby": "message-id"
            }}
            message={<span id="message-id">{this.state.activeTool}</span>}
          />,
          document.getElementById("map-overlay")
        )}
      </div>
    );
  }
}

SpatialSearchOptions.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles, { withTheme: true })(SpatialSearchOptions);
