import React from "react";
import cslx from "clsx";
import { withStyles } from "@material-ui/core/styles";
import { Vector as VectorLayer } from "ol/layer";
import VectorSource from "ol/source/Vector";
import { Stroke, Style, Circle, Fill } from "ol/style";
import Grid from "@material-ui/core/Grid";
import { FormHelperText } from "@material-ui/core";

import ClearIcon from "@material-ui/icons/Clear";

import {
  CircularProgress,
  IconButton,
  Paper,
  TextField,
  Checkbox,
  Popover,
  Typography,
} from "@material-ui/core";

import Autocomplete from "@material-ui/lab/Autocomplete";
import ToggleButton from "@material-ui/lab/ToggleButton";

import FormatSizeIcon from "@material-ui/icons/FormatSize";
import SearchIcon from "@material-ui/icons/Search";
import BrushTwoToneIcon from "@material-ui/icons/BrushTwoTone";
import WithinIcon from "@material-ui/icons/Adjust";
import IntersectsIcon from "@material-ui/icons/Toll";
import MoreHorizIcon from "@material-ui/icons/MoreHoriz";
import RoomIcon from "@material-ui/icons/Room";
import CheckBoxOutlineBlankIcon from "@material-ui/icons/CheckBoxOutlineBlank";
import CheckBoxIcon from "@material-ui/icons/CheckBox";
import PlaylistAddCheckIcon from "@material-ui/icons/PlaylistAddCheck";
import SearchResultsContainer from "./SearchResultsContainer";

const styles = (theme) => ({
  searchContainer: {
    width: 400,
    height: theme.spacing(6),
  },
  searchCollapsed: {
    left: -440,
  },
  inputRoot: {
    height: theme.spacing(6),
  },
  hidden: {
    display: "none",
  },
});

var drawStyle = new Style({
  stroke: new Stroke({
    color: "rgba(255, 214, 91, 0.6)",
    width: 4,
  }),
  fill: new Fill({
    color: "rgba(255, 214, 91, 0.2)",
  }),
  image: new Circle({
    radius: 6,
    stroke: new Stroke({
      color: "rgba(255, 214, 91, 0.6)",
      width: 2,
    }),
  }),
});

class SearchBar extends React.PureComponent {
  constructor(props) {
    super(props);

    this.map = props.map;
    this.searchModel = props.app.appModel.searchModel;

    this.drawSource = new VectorSource({ wrapX: false });
    this.drawLayer = new VectorLayer({
      source: this.drawSource,
      style: drawStyle,
    });

    // Add layer that will be used to allow user draw on map - used for spatial search
    this.map.addLayer(this.drawLayer);
  }

  state = {
    autoCompleteOpen: false,
    autoCompleteOptions: [],
    loading: false,
    wildcardAtStart: false,
    wildcardAtEnd: false,
    matchCase: false,
    activeSpatialFilter: "intersects",
    drawActive: false,
    panelCollapsed: false,
    searchString: "",
    searchSources: [],
    searchResults: { featureCollections: [], errors: [] },
    anchorEl: undefined,
    moreOptionsId: undefined,
    moreOptionsOpen: false,
    selectSourcesOpen: false,
    options: [],
    resultPanelCollapsed: false,
    showSearchResults: false,
  };

  /**
   * @summary Triggered when user selects a value/presses [Enter]. Makes a call and gets the actual search results.
   *
   * @param {Object} event
   * @param {String} value
   * @param {String} reason
   */
  handleOnChange = (event, value, reason) => {
    console.log("HERE");
    let searchString = value?.autocompleteEntry || value || "";
    // "value" can be String (if freeSolo) or Object (if autocomplete entry selected)
    // We must ensure that we grab the string either way.
    this.setState(
      {
        searchString: searchString,
        autoCompleteOpen: false,
      },
      () => {
        console.log("searchString:; ", searchString);
        if (this.state.searchString.length >= 3) {
          this.doSearch();
        }
      }
    );
  };

  /**
   * @summary Triggered each time user changes input field value (e.g. onKeyPress etc). Makes a call to get the autocomplete list.
   *
   * @param {Object} event
   * @param {String} value
   * @param {String} reason
   */
  handleOnInputChange = (event, value, reason) => {
    console.log("Current input value", value);

    const searchString = value;
    this.setState(
      {
        autoCompleteOpen: value.length >= 3,
        loading: value.length >= 3 && this.state.options.length === 0,
        showSearchResults: false,
        searchString: searchString,
      },
      () => {
        if (this.state.searchString.length >= 3) {
          this.getAutoCompleteOptions(this.state.searchString);
        } else {
          this.setState({
            options: [],
          });
        }
      }
    );
  };

  handleClickOnMoreOptions = (event) => {
    this.setState({
      anchorEl: event.currentTarget,
    });
  };

  handleClickOnSearch = () => {
    this.doSearch(this.state.searchString);
  };

  getAutoCompleteOptions = () => {
    let { searchSources } = this.state;
    if (searchSources.length === 0) {
      searchSources = this.searchModel.getSources();
    }

    let active = true;

    (async () => {
      try {
        console.log("Autocomplete search: ", this.state.searchString);
        const {
          flatAutocompleteArray,
          errors,
        } = await this.searchModel.getAutocomplete(
          this.state.searchString,
          searchSources // This is a state variable!
          // searchOptions // This is a dilemma: should we limit ourselves to wildcard
          // settings etc? Or should Autocomplete return all results, even if they
          // won't be returned by actuall search, due to the limitations
        );

        console.log("Autocomplete result: ", flatAutocompleteArray);

        // It is possible to check if Search Model returned any errors
        errors.length > 0 && console.error("Autocomplete error: ", errors);

        this.setState({
          options: flatAutocompleteArray,
          loading: false,
        });
      } catch (error) {
        // If we catch an error, display it to the user
        // (preferably in a Snackbar instead of console).
        console.error(error);

        // Also, set "open" state variable to false, which
        // abort the "loading" state of Autocomplete.
        if (active) {
          this.setState({
            open: false,
          });
        }
      } finally {
        // Regardless if we had an error or not, we're done.
        return () => {
          active = false;
        };
      }
    })();
  };

  getSearchOptionsWithUserCustomization = (searchOptionsFromModel) => {
    const {
      activeSpatialFilter,
      matchCase,
      wildcardAtEnd,
      wildcardAtStart,
    } = this.state;
    let customSearchOptions = { ...searchOptionsFromModel };
    // Apply our custom options based on user's selection
    customSearchOptions["activeSpatialFilter"] = activeSpatialFilter; // "intersects" or "within"
    customSearchOptions["featuresToFilter"] = this.drawSource.getFeatures();
    customSearchOptions["matchCase"] = matchCase;
    customSearchOptions["wildcardAtStart"] = wildcardAtStart;
    customSearchOptions["wildcardAtEnd"] = wildcardAtEnd;
    return customSearchOptions;
  };

  getSearchOptions = () => {
    // Grab existing search options from model
    const searchOptionsFromModel = this.searchModel.getSearchOptions();
    return this.getSearchOptionsWithUserCustomization(searchOptionsFromModel);
  };

  async doSearch() {
    // Wrap all calls to Search Model in a try/catch because
    // Search Model may throw Errors which we should handle
    // in the UI Component.
    if (this.state.searchString < 3) {
      return null;
    }
    let { searchSources } = this.state;
    if (searchSources.length === 0) {
      searchSources = this.searchModel.getSources();
    }
    try {
      const searchOptions = this.getSearchOptions();
      console.log(
        "Searching:",
        this.state.searchString,
        searchSources,
        searchOptions
      );
      const searchResults = await this.searchModel.getResults(
        this.state.searchString,
        searchSources, // this is a state variable!
        searchOptions
      );
      console.log("Results: ", searchResults);

      // It's possible to handle any errors in the UI by checking if Search Model returned any
      searchResults.errors.length > 0 && console.error(searchResults.errors);

      this.setState({
        searchResults,
        showSearchResults: true,
      });

      //addFeaturesToResultsLayer(featureCollections);
    } catch (err) {
      console.error("Show a nice error message to user with info:", err);
    }
  }

  renderPopopover = () => {
    const {
      moreOptionsId,
      anchorEl,
      wildcardAtEnd,
      wildcardAtStart,
      matchCase,
      drawActive,
      activeSpatialFilter,
      selectSourcesOpen,
    } = this.state;
    return (
      <Popover
        id={moreOptionsId}
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => this.setState({ anchorEl: null })}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
      >
        <Paper>
          <Typography>Fler inställningar</Typography>
          <ToggleButton
            value="selectSourcesOpen"
            selected={selectSourcesOpen}
            onChange={() =>
              this.setState({
                selectSourcesOpen: !selectSourcesOpen,
                anchorEl: undefined,
              })
            }
          >
            <PlaylistAddCheckIcon size="small" />
          </ToggleButton>
          <ToggleButton
            value="wildcardAtStart"
            selected={wildcardAtStart}
            onChange={() =>
              this.setState({ wildcardAtStart: !wildcardAtStart })
            }
          >
            *.
          </ToggleButton>
          <ToggleButton
            value="wildcardAtEnd"
            selected={wildcardAtEnd}
            onChange={() => this.setState({ wildcardAtEnd: !wildcardAtEnd })}
          >
            .*
          </ToggleButton>
          <ToggleButton
            value="matchCase"
            selected={matchCase}
            onChange={() => this.setState({ matchCase: !matchCase })}
          >
            <FormatSizeIcon />
          </ToggleButton>
          <ToggleButton
            value="drawActive"
            selected={drawActive}
            onChange={this.handleClickOnDrawToggle}
          >
            <BrushTwoToneIcon />
          </ToggleButton>
          <ToggleButton
            value="activeSpatialFilter"
            selected={activeSpatialFilter === "intersects"}
            onChange={() =>
              this.setState({
                activeSpatialFilter:
                  activeSpatialFilter === "intersects"
                    ? "within"
                    : "intersects",
              })
            }
          >
            {activeSpatialFilter === "intersects" ? (
              <IntersectsIcon />
            ) : (
              <WithinIcon />
            )}
          </ToggleButton>
        </Paper>
      </Popover>
    );
  };

  renderSearchResultList = () => {
    const { searchResults, resultPanelCollapsed } = this.state;

    return (
      <SearchResultsContainer
        searchResults={searchResults}
        resultsSource={this.drawSource}
        featureCollections={searchResults.featureCollections}
        map={this.map}
        panelCollapsed={resultPanelCollapsed}
      />
    );
  };

  renderAutoComplete = () => {
    const {
      options,
      loading,
      moreOptionsId,
      autoCompleteOpen,
      searchString,
    } = this.state;
    const { classes } = this.props;
    return (
      <Autocomplete
        id="searchInputField"
        freeSolo
        size={"small"}
        classes={{
          inputRoot: classes.inputRoot, // class name, e.g. `classes-nesting-root-x`
        }}
        clearOnEscape
        autoComplete
        autoHighlight
        open={autoCompleteOpen}
        disableClearable
        onChange={this.handleOnChange}
        onInputChange={this.handleOnInputChange}
        getOptionSelected={(option, value) =>
          option.autocompleteEntry === value.autocompleteEntry
        }
        renderOption={(option) => {
          return (
            <>
              <RoomIcon color="disabled"></RoomIcon>
              <Typography style={{ paddingRight: 8 }}>
                {option.autocompleteEntry}
              </Typography>
              <FormHelperText>{option.dataset}</FormHelperText>
            </>
          );
        }}
        getOptionLabel={(option) =>
          option?.autocompleteEntry + " " + option.dataset || option
        }
        //groupBy={(option) => option.dataset}
        options={options}
        loading={loading}
        renderInput={(params) => (
          <TextField
            {...params}
            label={undefined}
            variant="outlined"
            placeholder="Sök..."
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? (
                    <CircularProgress color="inherit" size={20} />
                  ) : null}
                  {params.InputProps.endAdornment}
                  <IconButton size="small" onClick={this.handleClickOnSearch}>
                    <SearchIcon />
                  </IconButton>
                  {searchString.length > 0 ? (
                    <IconButton size="small">
                      <ClearIcon />
                    </IconButton>
                  ) : (
                    <IconButton
                      size="small"
                      aria-describedby={moreOptionsId}
                      onClick={this.handleClickOnMoreOptions}
                    >
                      <MoreHorizIcon />
                    </IconButton>
                  )}
                </>
              ),
            }}
          />
        )}
      />
    );
  };

  renderSelectSearchOptions = () => {
    const { searchSources, selectSourcesOpen } = this.state;
    const { classes } = this.props;
    return (
      <Autocomplete
        className={cslx(selectSourcesOpen === false ? classes.hidden : null)}
        onChange={(event, value, reason) =>
          this.setState({ searchSources: value })
        }
        value={searchSources}
        multiple
        id="searchSources"
        options={this.searchModel.getSources()}
        disableCloseOnSelect
        getOptionLabel={(option) => option.caption}
        renderOption={(option, { selected }) => (
          <>
            <Checkbox
              icon={<CheckBoxOutlineBlankIcon fontSize="small" />}
              checkedIcon={<CheckBoxIcon fontSize="small" />}
              style={{ marginRight: 8 }}
              checked={selected}
            />
            {option.caption}
          </>
        )}
        style={{ width: 400 }}
        renderInput={(params) => (
          <TextField
            {...params}
            variant="outlined"
            // label="Sökkällor"
            placeholder="Välj sökkälla"
          />
        )}
      />
    );
  };

  render() {
    const { classes } = this.props;
    const { panelCollapsed, showSearchResults } = this.state;
    return (
      <Grid
        className={cslx(classes.searchContainer, {
          [classes.searchCollapsed]: panelCollapsed,
        })}
      >
        <Grid item>
          <Paper>
            {this.renderAutoComplete()}
            {this.renderPopopover()}
            {this.renderSelectSearchOptions()}
          </Paper>
        </Grid>
        {showSearchResults && this.renderSearchResultList()}
      </Grid>
    );
  }
}

export default withStyles(styles)(SearchBar);
