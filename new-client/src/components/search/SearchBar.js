import React, { useEffect, useRef, useState } from "react";

import SearchTools from "./SearchTools";
import SearchResultList from "./SearchResultList";
import SearchSettings from "./SearchSettings";

import {
  IconButton,
  Paper,
  TextField,
  Tooltip,
  makeStyles
} from "@material-ui/core";

import Autocomplete from "@material-ui/lab/Autocomplete";
import Divider from "@material-ui/core/Divider";
import MenuIcon from "@material-ui/icons/Menu";
import SearchIcon from "@material-ui/icons/Search";
import ClearIcon from "@material-ui/icons/Clear";

const useStyles = makeStyles(theme => ({
  root: {
    display: "flex",
    alignItems: "center"
  },
  input: {
    marginLeft: theme.spacing(1),
    flex: 1
  },
  iconButton: {
    padding: 10
  },
  divider: {
    height: 28,
    margin: 4
  },
  textField: {
    marginTop: 0,
    marginBottom: 0
  }
}));

const SearchBar = props => {
  const classes = useStyles();

  const { menuButtonDisabled, onMenuClick } = props;
  const searchModel = props.app.appModel.searchModel;
  const map = useRef(props.map);

  const tooltipText = menuButtonDisabled
    ? "Du måste först låsa upp verktygspanelen för kunna klicka på den här knappen. Tryck på hänglåset till vänster."
    : "Visa verktygspanelen";

  // Autocomplete state
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const loading = open && options.length === 0;
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    //if (searchInput.length > 3) return undefined;

    let active = true;

    if (!loading) {
      return undefined;
    }

    (async () => {
      console.log("Getting Autocomplete for: ", searchInput);
      const {
        flatAutocompleteArray,
        errors
      } = await searchModel.getAutocomplete(searchInput);

      console.log(
        "Got this back to populate autocomplete with: ",
        flatAutocompleteArray
      );

      // It is possible to check if Search Model returned any errors
      errors.length > 0 && console.error("Autocomplete error: ", errors);

      if (active) {
        setOptions(flatAutocompleteArray);
      }
    })();

    return () => {
      active = false;
    };
  }, [loading, searchModel]);

  useEffect(() => {
    if (!open) {
      setOptions([]);
    }
  }, [open]);

  const handleOnInputChange = (event, value, reason) => {
    setOpen(value.length >= 3);

    setSearchInput(value); // Local input value
    props.handleSearchInput(value); // Global input value
  };

  const handleOnChange = (event, value, reason) => {
    const inputValue = value?.autocompleteEntry || value;
    setOpen(value.length >= 3);

    setSearchInput(value); // Local input value
    props.handleSearchInput(value); // Global input value

    // Do a search if value is selected from autocomplete
    if (reason !== "input") {
      props.handleOnSearch(inputValue);
    }
  };

  function handleOnSearch() {
    // Search and close the autocomplete suggestions list
    setOpen(false);
    props.handleOnSearch(searchInput);
  }

  const handleOnClear = () => {
    setSearchInput("");
    props.handleOnClear();
  };

  return (
    <div>
      <Paper className={classes.root}>
        <Autocomplete
          id="searchInputField"
          freeSolo
          clearOnEscape
          disableClearable
          autoComplete
          style={{ width: 500 }}
          disabled={props.searchActive === "draw"}
          value={searchInput}
          options={options}
          loading={loading}
          onInputChange={handleOnInputChange}
          onChange={handleOnChange}
          getOptionSelected={(option, value) =>
            option.autocompleteEntry === value.autocompleteEntry
          }
          getOptionLabel={option => option?.autocompleteEntry || option}
          groupBy={option => option.dataset}
          renderOption={option => (
            <React.Fragment>
              <span>
                {option.autocompleteEntry}
                <em>{"(" + option.dataset + ")"}</em>
              </span>
            </React.Fragment>
          )}
          renderInput={params => (
            <TextField
              {...params}
              className={classes.textField}
              label={undefined}
              margin="normal"
              variant="outlined"
              placeholder="Sök i kartlager"
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <Tooltip title={tooltipText}>
                    <span id="drawerToggler">
                      <IconButton
                        className={classes.iconButton}
                        aria-label="menu"
                        onClick={onMenuClick}
                        disabled={menuButtonDisabled}
                      >
                        <MenuIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                ),
                endAdornment: (
                  <>
                    <IconButton
                      className={classes.iconButton}
                      aria-label="search"
                      onClick={handleOnSearch}
                    >
                      <SearchIcon />
                    </IconButton>
                    <Divider
                      className={classes.divider}
                      orientation="vertical"
                    />
                    {props.searchActive ? (
                      <IconButton
                        className={classes.iconButton}
                        aria-label="clear"
                        onClick={handleOnClear}
                      >
                        <ClearIcon />
                      </IconButton>
                    ) : (
                      <SearchTools {...props} />
                    )}
                    <SearchSettings {...props} />
                  </>
                )
              }}
            />
          )}
        />
      </Paper>
      <SearchResultList
        map={map}
        searchResults={props.searchResults}
        resultsSource={props.resultsSource}
      />
    </div>
  );
};

export default SearchBar;
