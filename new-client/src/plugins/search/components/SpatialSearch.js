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

const names = ["Polygon", "Radie", "Välj"];

class SpatialSearchOptions extends React.Component {
  state = {
    activeTool: ""
  };

  handleChange = event => {
    this.props.onChange(event);
    this.setState({ [event.target.name]: event.target.value });
  };

  render() {
    const { classes } = this.props;

    return (
      <div className={classes.root}>
        <FormControl className={classes.formControl}>
          <Select
            disableUnderline
            value={this.state.activeTool}
            onChange={this.handleChange}
            displayEmpty
            name="activeTool"
            MenuProps={{
              getContentAnchorEl: null,
              anchorOrigin: {
                vertical: "bottom",
                horizontal: "left"
              }
            }}
            className={classes.select}
          >
            <MenuItem value="" disabled>
              <Stop />
            </MenuItem>
            <MenuItem value={"polygon"} alignItems="center">
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
          </Select>
        </FormControl>
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
