import React from "react";

import { withStyles } from "@material-ui/core/styles";
import { withTranslation } from "react-i18next";
import {
  Tooltip,
  Grid,
  Switch,
  FormGroup,
  FormLabel,
  FormControl,
  FormControlLabel,
  Select,
  Chip,
  MenuItem,
  Input,
} from "@material-ui/core";

const styles = (theme) => ({
  chips: {
    display: "flex",
    flexWrap: "wrap",
  },
  chip: {
    margin: 2,
  },
});

class SearchSettings extends React.PureComponent {
  state = {
    showSearchSourcesFilter: this.props.searchSources.length > 0 ? true : false,
  };

  localUpdateSearchOptions = (name, value) => {
    const { searchOptions } = this.props;
    // Send the new values up to the Search component's state
    this.props.updateSearchOptions({ ...searchOptions, [name]: value });
  };

  render() {
    const { classes, searchOptions, searchSources, searchModel, t } =
      this.props;
    return (
      <Grid container spacing={2} direction="column">
        <Grid item xs>
          <FormControl component="fieldset">
            <FormLabel component="legend">
              {t("core.search.settings.general.title")}
            </FormLabel>
            <FormGroup>
              <Tooltip
                title={t("core.search.settings.general.limitSources.toolTip")}
              >
                <FormControlLabel
                  label={t("core.search.settings.general.limitSources.title")}
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
              </Tooltip>
              {this.state.showSearchSourcesFilter && (
                <Grid container spacing={2}>
                  <Grid item xs>
                    <Select
                      fullWidth
                      labelId="demo-mutiple-chip-label"
                      multiple
                      value={searchSources}
                      onChange={(event) =>
                        this.props.setSearchSources(event.target.value)
                      }
                      input={<Input id="select-multiple-chip" />}
                      renderValue={(selected) => (
                        <div className={classes.chips}>
                          {selected.map((option) => (
                            <Chip
                              key={option.id}
                              label={option.caption}
                              className={classes.chip}
                            />
                          ))}
                        </div>
                      )}
                    >
                      {searchModel.getSources().map((source) => (
                        <MenuItem
                          key={source.id}
                          value={source}
                          // style={getStyles(name, personName, theme)}
                        >
                          {source.caption}
                        </MenuItem>
                      ))}
                    </Select>
                  </Grid>
                </Grid>
              )}
            </FormGroup>
          </FormControl>
        </Grid>

        <Grid item xs>
          <FormControl component="fieldset">
            <FormLabel component="legend">
              {t("core.search.settings.text.title")}
            </FormLabel>
            <FormGroup>
              <Tooltip
                title={t("core.search.settings.text.wildcardAtStart.toolTip")}
              >
                <FormControlLabel
                  label={t("core.search.settings.text.wildcardAtStart.title")}
                  control={
                    <Switch
                      checked={searchOptions.wildcardAtStart}
                      onChange={() =>
                        this.localUpdateSearchOptions(
                          "wildcardAtStart",
                          !searchOptions.wildcardAtStart
                        )
                      }
                      color="primary"
                    />
                  }
                />
              </Tooltip>
              <Tooltip
                title={t("core.search.settings.text.wildcardAtEnd.toolTip")}
              >
                <FormControlLabel
                  label={t("core.search.settings.text.wildcardAtEnd.title")}
                  control={
                    <Switch
                      checked={searchOptions.wildcardAtEnd}
                      onChange={() =>
                        this.localUpdateSearchOptions(
                          "wildcardAtEnd",
                          !searchOptions.wildcardAtEnd
                        )
                      }
                      color="primary"
                    />
                  }
                />
              </Tooltip>
              <Tooltip title={t("core.search.settings.text.matchCase.toolTip")}>
                <FormControlLabel
                  label={t("core.search.settings.text.matchCase.title")}
                  control={
                    <Switch
                      checked={searchOptions.matchCase}
                      onChange={() =>
                        this.localUpdateSearchOptions(
                          "matchCase",
                          !searchOptions.matchCase
                        )
                      }
                      color="primary"
                    />
                  }
                />
              </Tooltip>
            </FormGroup>
          </FormControl>
        </Grid>

        <Grid item xs>
          <FormControl component="fieldset">
            <FormLabel component="legend">
              {t("core.search.settings.spatial.title")}
            </FormLabel>
            <FormGroup>
              <Tooltip
                title={t("core.search.settings.spatial.activeFilter.toolTip")}
              >
                <FormControlLabel
                  label={t("core.search.settings.spatial.activeFilter.title")}
                  control={
                    <Switch
                      checked={searchOptions.activeSpatialFilter === "within"}
                      onChange={() =>
                        this.localUpdateSearchOptions(
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
              </Tooltip>
            </FormGroup>
          </FormControl>
        </Grid>

        <Grid item xs>
          <FormControl component="fieldset">
            <FormLabel component="legend">
              {t("core.search.settings.resultsDisplay.title")}
            </FormLabel>
            <FormGroup>
              <Tooltip
                title={t(
                  "core.search.settings.resultsDisplay.mapLabels.toolTip"
                )}
              >
                <FormControlLabel
                  label={t(
                    "core.search.settings.resultsDisplay.mapLabels.title"
                  )}
                  control={
                    <Switch
                      checked={searchOptions.enableLabelOnHighlight}
                      onChange={() =>
                        this.localUpdateSearchOptions(
                          "enableLabelOnHighlight",
                          !searchOptions.enableLabelOnHighlight
                        )
                      }
                      color="primary"
                    />
                  }
                />
              </Tooltip>
            </FormGroup>
          </FormControl>
        </Grid>
      </Grid>
    );
  }
}

export default withTranslation()(withStyles(styles)(SearchSettings));
