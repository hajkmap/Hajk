import React from "react";
import cslx from "clsx";
import { withStyles } from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
import { FormHelperText } from "@material-ui/core";
import ClearIcon from "@material-ui/icons/Clear";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import { withTheme } from "@material-ui/core/styles";
import withWidth from "@material-ui/core/withWidth";

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
import Popper from "@material-ui/core/Popper";
import FormatSizeIcon from "@material-ui/icons/FormatSize";
import SearchIcon from "@material-ui/icons/Search";
import BrushTwoToneIcon from "@material-ui/icons/BrushTwoTone";
import WithinIcon from "@material-ui/icons/Adjust";
import IntersectsIcon from "@material-ui/icons/Toll";
import RoomIcon from "@material-ui/icons/Room";
import DescriptionIcon from "@material-ui/icons/Description";
import CheckBoxOutlineBlankIcon from "@material-ui/icons/CheckBoxOutlineBlank";
import CheckBoxIcon from "@material-ui/icons/CheckBox";
import PlaylistAddCheckIcon from "@material-ui/icons/PlaylistAddCheck";
import SearchResultsContainer from "./SearchResultsContainer";
import SearchTools from "./SearchTools";
import { useTheme } from "@material-ui/core/styles";

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

//Needed to make a CustomPopper with inlinestyling to be able to override width.. *
//Popper.js didnt work as expected
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
        },
      }}
      placement="bottom-start"
    />
  );
};

class SearchBar extends React.PureComponent {
  state = {
    drawActive: false,
    panelCollapsed: false,
    anchorEl: undefined,
    moreOptionsId: undefined,
    moreOptionsOpen: false,
    selectSourcesOpen: false,
    resultPanelCollapsed: false,
  };

  handleClickOnMoreOptions = (event) => {
    this.setState({
      anchorEl: event.currentTarget,
    });
  };

  updateSearchOptions = (name, value) => {
    const { searchOptions } = this.props;
    searchOptions[name] = value;
    this.props.updateSearchOptions(searchOptions);
  };

  getOriginBasedIcon = (origin) => {
    switch (origin) {
      case "WFS":
        return <RoomIcon color="disabled"></RoomIcon>;
      case "DOCUMENT":
        return <DescriptionIcon color="disabled"></DescriptionIcon>;
      default:
        return <RoomIcon color="disabled"></RoomIcon>;
    }
  };

  renderPopover = () => {
    const {
      moreOptionsId,
      anchorEl,
      drawActive,
      selectSourcesOpen,
    } = this.state;
    const { searchOptions } = this.props;
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
            selected={searchOptions.wildcardAtStart}
            onChange={() =>
              this.updateSearchOptions(
                "wildcardAtStart",
                !searchOptions.wildcardAtStart
              )
            }
          >
            *.
          </ToggleButton>
          <ToggleButton
            value="wildcardAtEnd"
            selected={searchOptions.wildcardAtEnd}
            onChange={() =>
              this.updateSearchOptions(
                "wildcardAtEnd",
                !searchOptions.wildcardAtEnd
              )
            }
          >
            .*
          </ToggleButton>
          <ToggleButton
            value="matchCase"
            selected={searchOptions.matchCase}
            onChange={() =>
              this.updateSearchOptions("matchCase", !searchOptions.matchCase)
            }
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
            selected={searchOptions.activeSpatialFilter === "intersects"}
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
        </Paper>
      </Popover>
    );
  };

  renderSearchResultList = () => {
    const { resultPanelCollapsed } = this.state;
    const { searchResults, app, map, resultSource, localObserver } = this.props;

    return (
      <SearchResultsContainer
        searchResults={searchResults}
        localObserver={localObserver}
        app={app}
        resultSource={resultSource}
        getOriginBasedIcon={this.getOriginBasedIcon}
        featureCollections={searchResults.featureCollections}
        map={map}
        panelCollapsed={resultPanelCollapsed}
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
    } = this.props;
    return (
      <Autocomplete
        id="searchInputField"
        freeSolo
        size={"small"}
        classes={{
          inputRoot: classes.inputRoot, // class name, e.g. `classes-nesting-root-x`
        }}
        PopperComponent={CustomPopper}
        clearOnEscape
        disabled={searchActive === "draw"}
        autoComplete
        value={searchString}
        selectOnFocus
        open={autoCompleteOpen}
        disableClearable
        onChange={this.props.handleSearchInput}
        onInputChange={this.props.handleOnInputChange}
        getOptionSelected={(option, value) =>
          option.autocompleteEntry === value.autocompleteEntry
        }
        renderOption={(option) => {
          return (
            <>
              {this.getOriginBasedIcon(option.origin)}

              <Typography style={{ paddingRight: 8 }}>
                {option.autocompleteEntry}
              </Typography>
              <FormHelperText>{option.dataset}</FormHelperText>
            </>
          );
        }}
        getOptionLabel={(option) => option?.autocompleteEntry || option}
        options={autocompleteList}
        loading={loading}
        renderInput={this.renderAutoCompleteInputField}
      />
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
      showSearchResults,

      searchOptions,
      searchSources,
      updateSearchOptions,
      searchModel,
      handleSearchSources,
    } = this.props;
    const disableUnderline = width === "xs" ? { disableUnderline: true } : null;

    return (
      <TextField
        {...params}
        label={undefined}
        variant={width === "xs" ? "standard" : "outlined"}
        placeholder="Sök..."
        InputProps={{
          ...params.InputProps,
          ...disableUnderline,
          endAdornment: (
            <>
              {loading ? <CircularProgress color="inherit" size={20} /> : null}
              {params.InputProps.endAdornment}
              <IconButton size="small" onClick={this.handleClickOnSearch}>
                <SearchIcon />
              </IconButton>
              {searchString.length > 0 ||
              showSearchResults ||
              searchActive !== "" ? (
                <IconButton onClick={this.props.handleOnClear} size="small">
                  <ClearIcon />
                </IconButton>
              ) : (
                <SearchTools
                  map={map}
                  searchSources={searchSources}
                  handleSearchSources={handleSearchSources}
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

  renderSelectSearchOptions = () => {
    const { selectSourcesOpen } = this.state;
    const { classes, searchModel, searchSources } = this.props;
    return (
      <Autocomplete
        className={cslx(selectSourcesOpen === false ? classes.hidden : null)}
        onChange={(event, value, reason) =>
          this.props.handleSearchSources(value)
        }
        value={searchSources}
        multiple
        id="searchSources"
        options={searchModel.getSources()}
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
    const { classes, showSearchResults, width } = this.props;
    const { panelCollapsed } = this.state;

    return (
      <Grid
        className={cslx(classes.searchContainer, {
          [classes.searchCollapsed]: panelCollapsed,
        })}
      >
        <Grid item>
          <Paper elevation={width === "xs" ? 0 : 1}>
            {this.renderAutoComplete()}
            {this.renderPopover()}
            {this.renderSelectSearchOptions()}
          </Paper>
        </Grid>

        {showSearchResults && this.renderSearchResultList()}
      </Grid>
    );
  }
}

export default withStyles(styles)(withTheme(withWidth()(SearchBar)));
