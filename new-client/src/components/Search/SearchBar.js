import React from "react";
import cslx from "clsx";
import Grid from "@material-ui/core/Grid";
import ClearIcon from "@material-ui/icons/Clear";
import withWidth from "@material-ui/core/withWidth";
import Autocomplete from "@material-ui/lab/Autocomplete";
import SearchIcon from "@material-ui/icons/Search";
import RoomIcon from "@material-ui/icons/Room";
import CheckIcon from "@material-ui/icons/Check";
import DescriptionIcon from "@material-ui/icons/Description";
import ExpandLessIcon from "@material-ui/icons/ExpandLess";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import WarningIcon from "@material-ui/icons/Warning";
import SearchResultsContainer from "./searchResults/SearchResultsContainer";
import SearchTools from "./SearchTools";
import { withTheme, useTheme, withStyles } from "@material-ui/core/styles";
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
} from "@material-ui/core";

const styles = (theme) => ({
  searchContainer: {
    width: 400,
    height: theme.spacing(6),
  },
  searchContainerRenderElsewhere: {
    width: 400,
    height: "auto",
  },
  searchCollapsed: {
    left: -440,
  },

  autocompleteTypography: {
    maxWidth: "100%",
  },

  inputRoot: {
    height: theme.spacing(6),
  },
  originIconWrapper: {
    display: "flex",
    flexWrap: "wrap",
    paddingRight: theme.spacing(1),
  },
});

//Needed to make a CustomPopper with inline styling to be able to override width,
//Popper.js didn't work as expected
const CustomPopper = (props) => {
  const theme = useTheme();
  const smallScreen = useMediaQuery(theme.breakpoints.down("xs"));
  const style = smallScreen ? { width: "100%" } : { width: 400 };
  return (
    <Popper
      {...props}
      style={style}
      popperOptions={{
        modifiers: {
          computeStyle: { gpuAcceleration: false },
          preventOverflow: {
            enabled: smallScreen,
            boundariesElement: "root",
          },
          hide: { enabled: smallScreen },
        },
      }}
      placement="bottom-end"
    />
  );
};

const CustomPaper = (props) => {
  const theme = useTheme();
  const smallScreen = useMediaQuery(theme.breakpoints.down("xs"));
  const style = smallScreen
    ? {
        margin: 0,
        borderTop: `${theme.spacing(0.2)}px solid ${theme.palette.divider}`,
      }
    : { margin: 0 };
  return <Paper {...props} style={style} />;
};

class SearchBar extends React.PureComponent {
  state = {
    drawActive: false,
    panelCollapsed: false,
    moreOptionsId: undefined,
    moreOptionsOpen: false,
    selectSourcesOpen: false,
  };

  updateSearchOptions = (name, value) => {
    const { searchOptions } = this.props;
    searchOptions[name] = value;
    this.props.updateSearchOptions(searchOptions);
  };

  getOriginBasedIcon = (origin) => {
    const { classes } = this.props;
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
    return <div className={classes.originIconWrapper}>{icon}</div>;
  };

  removeCommasAndSpaces = (string) => {
    return string.replace(/,/g, "").replace(/ /g, "");
  };

  //Can't use string.prototype.matchAll because of Edge (Polyfill not working atm)
  getMatches = (string, regex, index) => {
    var matches = [];
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
    const { getArrayWithSearchWords, classes } = this.props;
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
      <Typography noWrap={true} className={classes.autocompleteTypography}>
        {highlightInformation.length > 0
          ? this.renderHighlightedAutocompleteEntry(
              highlightInformation,
              autocompleteEntry
            )
          : autocompleteEntry}
      </Typography>
    );
  };

  getPlaceholder = () => {
    const { options, searchActive } = this.props;
    return searchActive === "selectSearch" || searchActive === "draw"
      ? "Söker med objekt..."
      : searchActive === "extentSearch"
      ? "Söker i området..."
      : options.searchBarPlaceholder ?? "Sök...";
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
      classes,
      loading,
      handleOnAutocompleteInputChange,
      handleSearchInput,
    } = this.props;
    return (
      <Autocomplete
        id="searchInputField"
        freeSolo
        size={"small"}
        classes={{
          inputRoot: classes.inputRoot,
        }}
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
        open={autoCompleteOpen}
        disableClearable
        onChange={handleSearchInput}
        onInputChange={handleOnAutocompleteInputChange}
        getOptionSelected={(option, value) =>
          option.autocompleteEntry === value.autocompleteEntry
        }
        renderOption={(option) => {
          if (searchString.length > 0) {
            return (
              <Grid container alignItems="center">
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
      <Tooltip title={errorMessage}>
        <WarningIcon color="error">
          <Typography variant="srOnly">{errorMessage}</Typography>
        </WarningIcon>
      </Tooltip>
    );
  };

  renderAutoCompleteInputField = (params) => {
    const {
      searchString,
      loading,
      width,
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
      searchModel,
      handleOnClickOrKeyboardSearch,
      setSearchSources,
      failedWFSFetchMessage,
    } = this.props;
    const disableUnderline = width === "xs" ? { disableUnderline: true } : null;
    const showFailedWFSMessage =
      failedWFSFetchMessage.length > 0 && showSearchResults;
    const expandMessage = resultPanelCollapsed
      ? "Visa sökresultat"
      : "Dölj sökresultat";
    const placeholder = this.getPlaceholder();
    return (
      <TextField
        {...params}
        label={undefined}
        variant={width === "xs" ? "standard" : "outlined"}
        placeholder={placeholder}
        onKeyPress={handleSearchBarKeyPress}
        InputProps={{
          ...params.InputProps,
          ...disableUnderline,
          endAdornment: (
            <>
              {loading ? <CircularProgress color="inherit" size={20} /> : null}
              {params.InputProps.endAdornment}
              {showFailedWFSMessage &&
                this.renderFailedWFSFetchWarning(failedWFSFetchMessage)}
              {!showSearchResults ? (
                <Tooltip title="Utför sökning">
                  <IconButton
                    size="small"
                    onClick={handleOnClickOrKeyboardSearch}
                  >
                    <Typography variant="srOnly">Exekvera sökning</Typography>
                    <SearchIcon />
                  </IconButton>
                </Tooltip>
              ) : (
                <Tooltip title={expandMessage}>
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCollapseSearchResults();
                    }}
                    size="small"
                  >
                    <Typography variant="srOnly">{expandMessage}</Typography>
                    {resultPanelCollapsed ? (
                      <ExpandMoreIcon />
                    ) : (
                      <ExpandLessIcon />
                    )}
                  </IconButton>
                </Tooltip>
              )}
              {searchString.length > 0 ||
              showSearchResults ||
              searchActive !== "" ? (
                <Tooltip title="Rensa sökning">
                  <IconButton onClick={handleOnClear} size="small">
                    <Typography variant="srOnly">Rensa sökning</Typography>
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
                />
              )}
            </>
          ),
        }}
      />
    );
  };

  render() {
    const { classes, showSearchResults, width } = this.props;
    const { panelCollapsed } = this.state;
    const { renderElsewhere } = this.props.options;

    return (
      <Grid
        className={cslx(
          renderElsewhere
            ? classes.searchContainerRenderElsewhere
            : classes.searchContainer,
          {
            [classes.searchCollapsed]: panelCollapsed,
          }
        )}
      >
        <Grid item>
          <Paper elevation={width === "xs" ? 0 : 1}>
            {this.renderAutoComplete()}
          </Paper>
        </Grid>
        {showSearchResults && this.renderSearchResultList()}
      </Grid>
    );
  }
}

export default withStyles(styles)(withTheme(withWidth()(SearchBar)));
