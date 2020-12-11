import React from "react";

import Autocomplete from "@material-ui/lab/Autocomplete";
import CheckBoxOutlineBlankIcon from "@material-ui/icons/CheckBoxOutlineBlank";
import CheckBoxIcon from "@material-ui/icons/CheckBox";
import { withStyles } from "@material-ui/core/styles";
import {
  // Tooltip,
  TextField,
  Checkbox,
  Grid,
  Switch,
  FormGroup,
  FormLabel,
  FormControl,
  FormControlLabel,
} from "@material-ui/core";

const styles = (theme) => ({});

class SearchSettings extends React.PureComponent {
  state = {
    searchOptions: this.props.searchOptions,
    showSearchSourcesFilter: this.props.searchSources.length > 0 ? true : false,
  };

  updateSearchOptions = (name, value) => {
    const { searchOptions } = this.props;
    searchOptions[name] = value;
    this.setState(searchOptions);
    this.props.updateSearchOptions(searchOptions);
  };

  render() {
    const { searchOptions, searchSources, searchModel } = this.props;
    return (
      <Grid container spacing={2} direction="column">
        <Grid item xs>
          <FormControl component="fieldset">
            <FormLabel component="legend">Generella sökinställningar</FormLabel>
            <FormGroup>
              <FormControlLabel
                label="Begränsa sökkällor"
                control={
                  <Switch
                    checked={this.state.showSearchSourcesFilter}
                    onChange={(e) => {
                      // Pull out the new value
                      const showSearchSourcesFilter = e.target.checked;

                      // Set state to reflect in Switch's UI
                      this.setState({
                        showSearchSourcesFilter,
                      });

                      // Now, if user has turned off this setting, ensure
                      // that we also clean all search sources
                      if (showSearchSourcesFilter === false)
                        this.props.setSearchSources([]);
                    }}
                    color="primary"
                  />
                }
              />
              {this.state.showSearchSourcesFilter && (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Autocomplete
                      id="searchSources"
                      multiple
                      value={searchSources}
                      onChange={(event, value, reason) =>
                        this.props.setSearchSources(value)
                      }
                      options={searchModel.getSources()}
                      disableCloseOnSelect
                      getOptionLabel={(option) => option.caption}
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
                      renderInput={(params) => (
                        <TextField {...params} variant="outlined" />
                      )}
                    />
                  </Grid>
                </Grid>
              )}
            </FormGroup>
          </FormControl>
        </Grid>

        <Grid item xs>
          <FormControl component="fieldset">
            <FormLabel component="legend">
              Inställningar för textsökning
            </FormLabel>
            <FormGroup>
              <FormControlLabel
                label="Wildcard före"
                control={
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
                }
              />
              <FormControlLabel
                label="Wildcard efter"
                control={
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
                }
              />
              <FormControlLabel
                label="Skiftlägeskänslighet"
                control={
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
                }
              />
            </FormGroup>
          </FormControl>
        </Grid>

        <Grid item xs>
          <FormControl component="fieldset">
            <FormLabel component="legend">Spatiala sökinställningar</FormLabel>
            <FormGroup>
              <FormControlLabel
                label="Kräv att hela objektet rymms inom sökområde"
                control={
                  <Switch
                    checked={searchOptions.activeSpatialFilter === "within"}
                    onChange={() =>
                      this.updateSearchOptions(
                        "activeSpatialFilter",
                        searchOptions.activeSpatialFilter === "intersects"
                          ? "within"
                          : "intersects"
                      )
                    }
                    color="primary"
                  />
                }
              />
            </FormGroup>
          </FormControl>
        </Grid>
      </Grid>
    );
  }
}

export default withStyles(styles)(SearchSettings);
