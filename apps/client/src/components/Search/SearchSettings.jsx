import React from "react";
import {
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
import HajkToolTip from "components/HajkToolTip";
import i18n from "src/i18n";

const ChipsWrapper = styled("div")(({ _theme }) => ({
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
    const { searchOptions, searchSources, searchModel } = this.props;

    const enabledSearchOptions = Array.isArray(this.props.enabledSearchOptions)
      ? this.props.enabledSearchOptions
      : false;

    const showSearchInVisibleLayers =
      !enabledSearchOptions ||
      enabledSearchOptions.includes("searchInVisibleLayers");
    const showWildcardAtStart =
      !enabledSearchOptions || enabledSearchOptions.includes("wildcardAtStart");
    const showWildcardAtEnd =
      !enabledSearchOptions || enabledSearchOptions.includes("wildcardAtEnd");
    const showMatchCase =
      !enabledSearchOptions || enabledSearchOptions.includes("matchCase");
    const showActiveSpatialFilter =
      !enabledSearchOptions ||
      enabledSearchOptions.includes("activeSpatialFilter");
    const showEnableLabelOnHighlight =
      !enabledSearchOptions ||
      enabledSearchOptions.includes("enableLabelOnHighlight");

    return (
      <Grid container spacing={2} direction="column">
        <Grid size="grow">
          <FormControl component="fieldset">
            <FormLabel component="legend">
              {i18n.t("search.settings.general")}
            </FormLabel>
            <FormGroup>
              <HajkToolTip
                title={i18n.t("search.settings.limitSourcesTooltip")}
              >
                <FormControlLabel
                  label={i18n.t("search.settings.limitSources")}
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
              </HajkToolTip>
              {this.state.showSearchSourcesFilter && (
                <Grid container spacing={2}>
                  <Grid size="grow">
                    <Select
                      fullWidth
                      labelId="demo-mutiple-chip-label"
                      multiple
                      value={searchSources.map((s) => s.id)}
                      onChange={(event) => {
                        const selectedIds = event.target.value;
                        const allSources = searchModel.getSources();
                        const selectedSources = allSources.filter((s) =>
                          selectedIds.includes(s.id)
                        );
                        this.props.setSearchSources(selectedSources);
                      }}
                      input={<Input id="select-multiple-chip" />}
                      renderValue={(selected) => (
                        <ChipsWrapper>
                          {selected.map((id) => {
                            const source = searchModel
                              .getSources()
                              .find((s) => s.id === id);
                            return source ? (
                              <Chip
                                key={id}
                                label={source.caption}
                                sx={{ margin: 0.25 }}
                              />
                            ) : null;
                          })}
                        </ChipsWrapper>
                      )}
                    >
                      {searchModel
                        .getSources()
                        .sort((a, b) => a.caption.localeCompare(b.caption))
                        .map((source) => (
                          <MenuItem key={source.id} value={source.id}>
                            {source.caption}
                          </MenuItem>
                        ))}
                    </Select>
                  </Grid>
                </Grid>
              )}
            </FormGroup>
            {showSearchInVisibleLayers && (
              <FormGroup>
                <HajkToolTip
                  title={i18n.t("search.settings.visibleLayersOnlyTooltip")}
                >
                  <FormControlLabel
                    label={i18n.t("search.settings.visibleLayersOnly")}
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
                </HajkToolTip>
              </FormGroup>
            )}
          </FormControl>
        </Grid>
        <Grid size="grow">
          <FormControl component="fieldset">
            <FormLabel component="legend">
              {i18n.t("search.settings.text")}
            </FormLabel>
            <FormGroup>
              {showWildcardAtStart && (
                <HajkToolTip
                  disableInteractive
                  title={i18n.t("search.settings.wildcardBeforeTooltip")}
                >
                  <FormControlLabel
                    label={i18n.t("search.settings.wildcardBefore")}
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
                </HajkToolTip>
              )}
              {showWildcardAtEnd && (
                <HajkToolTip
                  disableInteractive
                  title={i18n.t("search.settings.wildcardAfterTooltip")}
                >
                  <FormControlLabel
                    label={i18n.t("search.settings.wildcardAfter")}
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
                </HajkToolTip>
              )}
              {showMatchCase && (
                <HajkToolTip
                  disableInteractive
                  title={i18n.t("search.settings.caseSensitiveTooltip")}
                >
                  <FormControlLabel
                    label={i18n.t("search.settings.caseSensitive")}
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
                </HajkToolTip>
              )}
              {showActiveSpatialFilter && (
                <Grid size="grow">
                  <FormControl component="fieldset">
                    <FormLabel component="legend">
                      {i18n.t("search.settings.spatial")}
                    </FormLabel>
                    <FormGroup>
                      <HajkToolTip
                        disableInteractive
                        title={i18n.t(
                          "search.settings.activeSpatialFilterTooltip"
                        )}
                      >
                        <FormControlLabel
                          label={i18n.t("search.settings.activeSpatialFilter")}
                          control={
                            <Switch
                              checked={
                                searchOptions.activeSpatialFilter === "within"
                              }
                              onChange={() =>
                                this.localUpdateSearchOptions(
                                  "activeSpatialFilter",
                                  searchOptions.activeSpatialFilter ===
                                    "intersects"
                                    ? "within"
                                    : "intersects"
                                )
                              }
                              color="primary"
                            />
                          }
                        />
                      </HajkToolTip>
                    </FormGroup>
                  </FormControl>
                </Grid>
              )}
              {showEnableLabelOnHighlight && (
                <Grid size="grow">
                  <FormControl component="fieldset">
                    <FormLabel component="legend">
                      {i18n.t("search.settings.display")}
                    </FormLabel>
                    <FormGroup>
                      <HajkToolTip
                        disableInteractive
                        title={i18n.t(
                          "search.settings.labelOnHighlightTooltip"
                        )}
                      >
                        <FormControlLabel
                          label={i18n.t("search.settings.labelOnHighlight")}
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
                      </HajkToolTip>
                    </FormGroup>
                  </FormControl>
                </Grid>
              )}
            </FormGroup>
          </FormControl>
        </Grid>
      </Grid>
    );
  }
}

export default SearchSettings;
