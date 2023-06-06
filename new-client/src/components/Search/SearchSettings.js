import React from "react";
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
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { withTranslation } from "react-i18next";

const ChipsWrapper = styled("div")(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
}));

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
    const { searchOptions, searchSources, searchModel, t } = this.props;
    return (
      <Grid container spacing={2} direction="column">
        <Grid item xs>
          <FormControl component="fieldset">
            <FormLabel component="legend">
              {t("core.search.settings.general.title")}
            </FormLabel>
            <FormGroup>
              <Tooltip
                disableInteractive
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
                        <ChipsWrapper>
                          {selected.map((option) => (
                            <Chip
                              key={option.id}
                              label={option.caption}
                              sx={{ margin: 0.25 }}
                            />
                          ))}
                        </ChipsWrapper>
                      )}
                    >
                      {searchModel
                        .getSources()
                        .sort((a, b) => a.caption.localeCompare(b.caption))
                        .map((source) => (
                          <MenuItem key={source.id} value={source}>
                            {source.caption}
                          </MenuItem>
                        ))}
                    </Select>
                  </Grid>
                </Grid>
              )}
            </FormGroup>
            <FormGroup>
              <Tooltip
                title={t(
                  "core.search.settings.general.useVisibleSources.toolTip"
                )}
              >
                <FormControlLabel
                  label={t(
                    "core.search.settings.general.useVisibleSources.title"
                  )}
                  control={
                    <Switch
                      checked={searchOptions.searchInVisibleLayers}
                      onChange={() => {
                        this.localUpdateSearchOptions(
                          "searchInVisibleLayers",
                          !searchOptions.searchInVisibleLayers
                        );
                      }}
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
              {t("core.search.settings.text.title")}
            </FormLabel>
            <FormGroup>
              <Tooltip
                disableInteractive
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
                disableInteractive
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
              <Tooltip
                disableInteractive
                title={t("core.search.settings.text.matchCase.toolTip")}
              >
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
                disableInteractive
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
                disableInteractive
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

export default withTranslation()(SearchSettings);
