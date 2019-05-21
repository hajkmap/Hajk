import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import Typography from "@material-ui/core/Typography";
import { withStyles } from "@material-ui/core/styles";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import Select from "@material-ui/core/Select";
import CropSquare from "@material-ui/icons/CropSquare";
import TripOrigin from "@material-ui/icons/TripOrigin";
import TouchApp from "@material-ui/icons/TouchApp";
import Grid from "@material-ui/core/Grid";
import Icon from "@material-ui/core/Icon";

const styles = theme => ({
  root: {
    display: "flex",
    flexWrap: "wrap"
  },

  formControl: {
    margin: theme.spacing.unit,
    minWidth: 150,
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
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            <MenuItem alignItems="center" value={"polygon"}>
              <Grid container direction="row" alignItems="center">
                <Grid item>
                  <CropSquare />
                </Grid>
                <Typography variant="subtitle1" gutterBottom>
                  Rita
                </Typography>
              </Grid>
            </MenuItem>
            <MenuItem value={"radius"}>
              <Grid container direction="row" alignItems="center">
                <Grid item>
                  <TripOrigin />
                </Grid>
                <Typography variant="subtitle1" gutterBottom>
                  Radie
                </Typography>
              </Grid>
            </MenuItem>
            <MenuItem value={"select"}>
              <Grid container direction="row" alignItems="center">
                <Grid item>
                  <TouchApp />
                </Grid>
                <Typography variant="subtitle1" gutterBottom>
                  Markera
                </Typography>
              </Grid>
            </MenuItem>
          </Select>
        </FormControl>
      </div>
    );
  }
}

SpatialSearchOptions.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles, { withTheme: true })(SpatialSearchOptions);
