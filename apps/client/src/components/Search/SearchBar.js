import React from "react";
import Grid from "@mui/material/Grid";
import ClearIcon from "@mui/icons-material/Clear";
import Autocomplete, { autocompleteClasses } from "@mui/material/Autocomplete";
import SearchIcon from "@mui/icons-material/Search";
import RoomIcon from "@mui/icons-material/Room";
import CheckIcon from "@mui/icons-material/Check";
import DescriptionIcon from "@mui/icons-material/Description";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import WarningIcon from "@mui/icons-material/Warning";
import SearchResultsContainer from "./searchResults/SearchResultsContainer";
import SearchTools from "./SearchTools";
import { useTheme } from "@mui/material";
import { decodeCommas } from "../../utils/StringCommaCoder";
import {
  CircularProgress,
  IconButton,
  Paper,
  TextField,
  Typography,
  FormHelperText,
  useMediaQuery,
  Popper,
  Tooltip,
} from "@mui/material";
import { visuallyHidden } from "@mui/utils";
import { styled } from "@mui/material/styles";
import { Visibility, VisibilityOff } from "@mui/icons-material";

// A HOC that pipes isMobile to the children. See this as a proposed
// solution. It is not pretty, but if we move this to a separate file
// we could use this HOC instead of the isMobile helper function in ../../utils/.
// TODO: Move to some /hooks folder
const withIsMobile = () => (WrappedComponent) => (props) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  return <WrappedComponent {...props} isMobile={isMobile} />;
};

const StyledAutocomplete = styled(Autocomplete)(({ theme }) => ({
  [`& .${autocompleteClasses.inputRoot}`]: {
    height: theme.spacing(6),
  },
}));

const IconWrapper = styled("div")(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  paddingRight: theme.spacing(1),
}));

//Needed to make a CustomPopper with inline styling to be able to override width,
//Popper.js didn't work as expected
const CustomPopper = (props) => {
  const theme = useTheme();
  const smallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const style = smallScreen ? { width: "100%" } : { width: 400 };
  return (
    <Popper
      {...props}
      style={style}
      popperOptions={{
        modifiers: [
          {
            name: "preventOverflow",
            enabled: smallScreen,
            options: {
              boundariesElement: "root",
            },
          },
          {
            name: "hide",
            enabled: smallScreen,
          },
        ],
      }}
      placement="bottom-end"
    />
  );
};

const CustomPaper = (props) => {
  const theme = useTheme();
  const smallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const style = smallScreen
    ? {
        margin: 0,
        borderTop: `${theme.spacing(0.2)} solid ${theme.palette.divider}`,
      }
    : { margin: 0 };
  return <Paper {...props} style={style} />;
};

class SearchBar extends React.PureComponent {
  state = {
    drawActive: false,
    moreOptionsId: undefined,
    moreOptionsOpen: false,
    selectSourcesOpen: false,
    resultsLayerVisible: true,
  };

  componentDidMount() {
    // The OL layer that holds the result features. We grab
    // it here so we can control its visibility using a button
    // in the search bar.
    this.resultsLayer = this.props.mapViewModel.resultsLayer;

    // Ensure that our state is synced to the actual visibility state
    // of the OL layer
    if (this.resultsLayer.getVisible() !== true) {
      this.setState({ resultsLayer: false });
    }
  }

  toggleResultsLayerVisibility = () => {
    const isVisible = this.resultsLayer.getVisible();
    if (isVisible) {
      this.resultsLayer.setVisible(false);
      this.setState({ resultsLayerVisible: false });
    } else {
      this.resultsLayer.setVisible(true);
      this.setState({ resultsLayerVisible: true });
    }
  };

  getOriginBasedIcon = (origin) => {
    let icon;
    switch (origin) {
      case "WFS":
        icon = <RoomIcon color="disabled" />;
        break;
      case "DOCUMENT":
        icon = <DescriptionIcon color="disabled" />;
        break;
      case "USERSELECT":
        icon = <CheckIcon color="disabled" />;
        break;
      default:
        icon = <RoomIcon color="disabled" />;
    }
    return <IconWrapper>{icon}</IconWrapper>;
  };

  removeCommasAndSpaces = (string) => {
    return string.replace(/,/g, "").replace(/ /g, "");
  };

  //Can't use string.prototype.matchAll because of Edge (Polyfill not working atm)
  getMatches = (string, regex, index) => {
    const matches = [];
    var match = regex.exec(string);

    while (match != null && match[0] !== "") {
      matches.push(match);
      match = regex.exec(string);
    }
    return matches;
  };

  getAllStartingIndexForOccurencesInString = (toSearchFor, toSearchIn) => {
    let regexp = new RegExp(this.props.escapeRegExp(toSearchIn), "gi");
    let matches = this.getMatches(toSearchFor, regexp);
    let matchedIndexes = matches.map((match) => match.index);
    return matchedIndexes;
  };

  getHighlightedAutoCompleteEntryElement = (
    lastHighlightInformation,
    autocompleteEntry
  ) => {
    let { index, length } = lastHighlightInformation;
    return (
      <>
        <strong>{autocompleteEntry.slice(0, index + length)}</strong>
        {autocompleteEntry.slice(index + length)}
      </>
    );
  };

  //Highlights everything in autocomplete entry up until the last occurrence of a match in string.
  renderHighlightedAutocompleteEntry = (
    highlightInformation,
    autocompleteEntry
  ) => {
    const countOfHighlightInformation = highlightInformation.length;
    //We get lastHighlightInformation because we want to highlight everything up to last word that matches
    const lastHighlightInformation =
      highlightInformation[countOfHighlightInformation - 1];

    if (countOfHighlightInformation > 0) {
      return this.getHighlightedAutoCompleteEntryElement(
        lastHighlightInformation,
        autocompleteEntry
      );
    }
  };

  getHighlightedACE = (searchString, autocompleteEntry) => {
    const { getArrayWithSearchWords } = this.props;
    const stringArraySS = getArrayWithSearchWords(searchString);

    let highlightInformation = stringArraySS
      .map((searchWord) => {
        return this.getAllStartingIndexForOccurencesInString(
          autocompleteEntry,
          searchWord
        ).map((index) => {
          return {
            index: index,
            length: searchWord.length,
          };
        });
      })
      .flat();

    return (
      <Typography noWrap={true} sx={{ maxWidth: "100%" }}>
        {highlightInformation.length > 0
          ? this.renderHighlightedAutocompleteEntry(
              highlightInformation,
              autocompleteEntry
            )
          : autocompleteEntry}
      </Typography>
    );
  };

  /**
   * @summary Prepare a label to show as the placeholder in the Search bar
   * @returns {string} placeholder text
   */
  getPlaceholder = () => {
    const {
      options,
      searchActive,
      searchOptions: { searchInVisibleLayers },
    } = this.props;

    const labelPostfix = searchInVisibleLayers
      ? " (endast i synliga lager)"
      : "";

    return searchActive === "selectSearch" || searchActive === "draw"
      ? `Söker med objekt${labelPostfix}`
      : searchActive === "extentSearch"
        ? `Söker i området${labelPostfix}`
        : options.searchBarPlaceholder
          ? `${options.searchBarPlaceholder}${labelPostfix}`
          : `Sök${labelPostfix}`;
  };

  renderSearchResultList = () => {
    const {
      searchResults,
      app,
      map,
      localObserver,
      resultPanelCollapsed,
      toggleCollapseSearchResults,
      options,
    } = this.props;

    return (
      <SearchResultsContainer
        searchResults={searchResults}
        localObserver={localObserver}
        app={app}
        getOriginBasedIcon={this.getOriginBasedIcon}
        featureCollections={searchResults.featureCollections}
        map={map}
        panelCollapsed={resultPanelCollapsed}
        toggleCollapseSearchResults={toggleCollapseSearchResults}
        options={options}
      />
    );
  };

  renderAutoComplete = () => {
    const {
      autocompleteList,
      autoCompleteOpen,
      searchString,
      searchActive,
      loading,
      handleOnAutocompleteInputChange,
      handleSearchInput,
    } = this.props;
    return (
      <StyledAutocomplete
        id="searchInputField"
        freeSolo
        size={"small"}
        PopperComponent={CustomPopper}
        PaperComponent={CustomPaper}
        clearOnEscape
        disabled={
          searchActive === "extentSearch" ||
          searchActive === "selectSearch" ||
          searchActive === "draw"
        }
        autoComplete
        value={decodeCommas(searchString)}
        selectOnFocus
        blurOnSelect
        open={autoCompleteOpen}
        disableClearable
        onChange={handleSearchInput}
        onInputChange={handleOnAutocompleteInputChange}
        isOptionEqualToValue={(option, value) =>
          option.autocompleteEntry === value.autocompleteEntry
        }
        renderOption={(props, option) => {
          if (searchString.length > 0) {
            return (
              // Important: the `key` prop must be set last, so we override the
              // one that gets there when we spread props (there is already a key
              // there, which can become duplicated under some circumstances).
              <Grid container alignItems="center" {...props} key={props.id}>
                <Grid item xs={1}>
                  {this.getOriginBasedIcon(option.origin)}
                </Grid>
                <Grid container item xs={11}>
                  <Grid item xs={12}>
                    {this.getHighlightedACE(
                      searchString,
                      decodeCommas(option.autocompleteEntry)
                    )}
                  </Grid>
                  <Grid item xs={12}>
                    <FormHelperText>{option.dataset}</FormHelperText>
                  </Grid>
                </Grid>
              </Grid>
            );
          }
        }}
        getOptionLabel={(option) => {
          return option?.autocompleteEntry?.length > 0
            ? decodeCommas(option?.autocompleteEntry)
            : option;
        }}
        options={autocompleteList}
        loading={loading}
        renderInput={this.renderAutoCompleteInputField}
      />
    );
  };

  renderFailedWFSFetchWarning = (errorMessage) => {
    return (
      <Tooltip disableInteractive title={errorMessage}>
        <WarningIcon color="error">
          <span style={visuallyHidden}>{errorMessage}</span>
        </WarningIcon>
      </Tooltip>
    );
  };

  renderAutoCompleteInputField = (params) => {
    const {
      searchString,
      loading,
      searchActive,
      map,
      app,
      handleOnClear,
      showSearchResults,
      toggleCollapseSearchResults,
      resultPanelCollapsed,
      handleSearchBarKeyPress,
      searchOptions,
      searchSources,
      updateSearchOptions,
      enabledSearchOptions,
      searchModel,
      handleOnClickOrKeyboardSearch,
      setSearchSources,
      failedWFSFetchMessage,
      isMobile,
    } = this.props;
    const disableUnderline = isMobile ? { disableUnderline: true } : null;
    const showFailedWFSMessage =
      failedWFSFetchMessage.length > 0 && showSearchResults;

    const expandMessage = resultPanelCollapsed
      ? "Visa lista med sökresultat"
      : "Dölj lista med sökresultat";

    const toggleResultsLayerVisibilityMessage = this.state.resultsLayerVisible
      ? "Dölj sökresultat i kartan"
      : "Visa sökresultat i kartan";

    const placeholder = this.getPlaceholder();
    return (
      <TextField
        {...params}
        label={<span style={visuallyHidden}>Sök i webbplatsens innehåll</span>}
        variant={isMobile ? "standard" : "outlined"}
        placeholder={placeholder}
        autoFocus={this.props.options?.autofocusOnStart ?? false}
        onKeyPress={handleSearchBarKeyPress}
        InputLabelProps={{ shrink: true }}
        InputProps={{
          ...params.InputProps,
          ...disableUnderline,
          style: { margin: 0 },
          notched: isMobile ? null : false,
          endAdornment: (
            <>
              {loading ? <CircularProgress color="inherit" size={20} /> : null}
              {params.InputProps.endAdornment}
              {showFailedWFSMessage &&
                this.renderFailedWFSFetchWarning(failedWFSFetchMessage)}
              {!showSearchResults ? (
                <Tooltip disableInteractive title="Utför sökning">
                  <IconButton
                    size="small"
                    onClick={handleOnClickOrKeyboardSearch}
                  >
                    <span style={visuallyHidden}>Utför sökning</span>
                    <SearchIcon />
                  </IconButton>
                </Tooltip>
              ) : (
                <>
                  <Tooltip disableInteractive title={expandMessage}>
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCollapseSearchResults();
                      }}
                      size="small"
                    >
                      <span style={visuallyHidden}>{expandMessage}</span>
                      {resultPanelCollapsed ? (
                        <ExpandMoreIcon />
                      ) : (
                        <ExpandLessIcon />
                      )}
                    </IconButton>
                  </Tooltip>
                  <Tooltip
                    disableInteractive
                    title={toggleResultsLayerVisibilityMessage}
                  >
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        this.toggleResultsLayerVisibility();
                      }}
                      size="small"
                    >
                      <span style={visuallyHidden}>
                        {toggleResultsLayerVisibilityMessage}
                      </span>
                      {this.state.resultsLayerVisible ? (
                        <VisibilityOff />
                      ) : (
                        <Visibility />
                      )}
                    </IconButton>
                  </Tooltip>
                </>
              )}
              {searchString.length > 0 ||
              showSearchResults ||
              searchActive !== "" ? (
                <Tooltip disableInteractive title="Rensa sökning">
                  <IconButton onClick={handleOnClear} size="small">
                    <span style={visuallyHidden}>Rensa sökning</span>
                    <ClearIcon />
                  </IconButton>
                </Tooltip>
              ) : (
                <SearchTools
                  map={map}
                  searchSources={searchSources}
                  setSearchSources={setSearchSources}
                  app={app}
                  searchOptions={searchOptions}
                  searchTools={this.props.searchTools}
                  searchModel={searchModel}
                  updateSearchOptions={updateSearchOptions}
                  enabledSearchOptions={enabledSearchOptions}
                />
              )}
            </>
          ),
        }}
      />
    );
  };

  render() {
    const { showSearchResults, isMobile } = this.props;
    const { renderElsewhere } = this.props.options;

    return (
      <Grid
        sx={{
          width: 400,
          height: (theme) => (renderElsewhere ? "auto" : theme.spacing(6)),
        }}
      >
        <Grid item>
          <Paper elevation={isMobile ? 0 : 1}>
            {this.renderAutoComplete()}
          </Paper>
        </Grid>
        {showSearchResults && this.renderSearchResultList()}
      </Grid>
    );
  }
}

export default withIsMobile()(SearchBar);
