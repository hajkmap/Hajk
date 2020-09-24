import { withStyles } from "@material-ui/core/styles";

import React from "react";
import FormGroup from "@material-ui/core/FormGroup";
import Switch from "@material-ui/core/Switch";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import ToggleButton from "@material-ui/lab/ToggleButton";
import IntersectsIcon from "@material-ui/icons/Toll";
import WithinIcon from "@material-ui/icons/Adjust";
import Checkbox from "@material-ui/core/Checkbox";
import TextField from "@material-ui/core/TextField";
import Autocomplete from "@material-ui/lab/Autocomplete";
import CheckBoxOutlineBlankIcon from "@material-ui/icons/CheckBoxOutlineBlank";
import CheckBoxIcon from "@material-ui/icons/CheckBox";
import Tooltip from "@material-ui/core/Tooltip";

const styles = theme => ({
  form: {
    display: "flex",
    flexDirection: "column",
    minWidth: 300
  },
  formControl: {
    marginTop: theme.spacing(2),
    minWidth: 300
  },
  formControlLabel: {
    marginTop: theme.spacing(1)
  },
  gridItem: {
    textAlign: "right"
  }
});

class SearchSettings extends React.PureComponent {
  state = {
    searchOptions: this.props.searchOptions
  };

  updateSearchOptions = (name, value) => {
    const { searchOptions } = this.props;
    searchOptions[name] = value;
    this.setState(searchOptions);
    this.props.updateSearchOptions(searchOptions);
  };

  render() {
    const { classes, searchOptions, searchSources, searchModel } = this.props;
    return (
      <React.Fragment>
        <FormGroup className={classes.form} noValidate>
          <Typography component="div">
            <Grid
              component="label"
              alignItems="center"
              style={{ width: "100%" }}
              container
              spacing={2}
            >
              <Grid item xs={6}>
                Wildcard före{" "}
              </Grid>
              <Grid item xs={6} className={classes.gridItem}>
                <Switch
                  checked={searchOptions.wildcardAtStart}
                  onChange={() =>
                    this.updateSearchOptions(
                      "wildcardAtStart",
                      !searchOptions.wildcardAtStart
                    )
                  }
                  color="primary"
                />
              </Grid>
            </Grid>
            <Grid
              component="label"
              container
              style={{ width: "100%" }}
              spacing={2}
              alignItems="center"
            >
              <Grid item xs={6}>
                Wildcard efter{" "}
              </Grid>
              <Grid item xs={6} className={classes.gridItem}>
                <Switch
                  checked={searchOptions.wildcardAtEnd}
                  onChange={() =>
                    this.updateSearchOptions(
                      "wildcardAtEnd",
                      !searchOptions.wildcardAtEnd
                    )
                  }
                  color="primary"
                />
              </Grid>
            </Grid>
            <Grid
              component="label"
              container
              spacing={2}
              style={{ width: "100%" }}
              alignItems="center"
            >
              <Grid item xs={6}>
                Skiftlägeskänslighet
              </Grid>
              <Grid item xs={6} className={classes.gridItem}>
                <Switch
                  checked={searchOptions.matchCase}
                  onChange={() =>
                    this.updateSearchOptions(
                      "matchCase",
                      !searchOptions.matchCase
                    )
                  }
                  color="primary"
                />
              </Grid>
            </Grid>
            <Grid
              component="label"
              container
              spacing={2}
              style={{ width: "100%" }}
              alignItems="center"
            >
              <Grid item xs={6}>
                Sökområde
              </Grid>
              <Grid item xs={6} className={classes.gridItem}>
                <Tooltip title={searchOptions.activeSpatialFilter}>
                  <ToggleButton
                    value="activeSpatialFilter"
                    onChange={() =>
                      this.updateSearchOptions(
                        "activeSpatialFilter",
                        searchOptions.activeSpatialFilter === "intersects"
                          ? "within"
                          : "intersects"
                      )
                    }
                  >
                    {searchOptions.activeSpatialFilter === "intersects" ? (
                      <IntersectsIcon />
                    ) : (
                      <WithinIcon />
                    )}
                  </ToggleButton>
                </Tooltip>
              </Grid>
            </Grid>
            <Grid
              component="label"
              container
              spacing={2}
              style={{ width: "100%" }}
              alignItems="center"
            >
              <Grid item xs={12}>
                Sökkälla
              </Grid>
              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  id="searchSources"
                  value={searchSources}
                  onChange={(event, value, reason) =>
                    this.props.setSearchSources(value)
                  }
                  options={searchModel.getSources()}
                  disableCloseOnSelect
                  getOptionLabel={option => option.caption}
                  renderOption={(option, { selected }) => (
                    <React.Fragment>
                      <Checkbox
                        icon={<CheckBoxOutlineBlankIcon fontSize="small" />}
                        checkedIcon={<CheckBoxIcon fontSize="small" />}
                        style={{ marginRight: 8 }}
                        checked={selected}
                        color="primary"
                      />
                      {option.caption}
                    </React.Fragment>
                  )}
                  renderInput={params => (
                    <TextField {...params} variant="outlined" />
                  )}
                />
              </Grid>
            </Grid>
          </Typography>
        </FormGroup>
      </React.Fragment>
    );
  }
}

export default withStyles(styles)(SearchSettings);
