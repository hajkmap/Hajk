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
import Alert from "@material-ui/lab/Alert";
import Collapse from "@material-ui/core/Collapse";
import CloseIcon from "@material-ui/icons/Close";

const useStyles = makeStyles(theme => ({
  root: {
    padding: "2px 4px",
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

  function handleOnInputChange(event, value, reason) {
    setSearchInput(event.target.value);
    setOpen(value.length >= 3);
  }

  function handleOnChange(event, value, reason) {
    const searchInput = value?.autocompleteEntry || value;
    setSearchInput(searchInput);
    props.handleOnSearch(searchInput);
  }

  return (
    <div>
      <Paper className={classes.root}>
        <Autocomplete
          id="searchInputField"
          freeSolo
          clearOnEscape
          style={{ width: 500 }}
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
              label={undefined}
              margin="normal"
              variant="outlined"
              placeholder="Skriv eller välj bland förslagen nedan..."
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
                      onClick={() => {
                        setOpen(false);
                        props.handleOnSearch(searchInput);
                      }}
                    >
                      <SearchIcon />
                    </IconButton>
                    <Divider
                      className={classes.divider}
                      orientation="vertical"
                    />
                    <SearchTools {...props} />
                    <SearchSettings {...props} />
                    <IconButton
                      className={classes.iconButton}
                      aria-label="clear"
                      onClick={props.handleOnClear}
                      disabled={!props.clearButtonActive}
                    >
                      <ClearIcon />
                    </IconButton>
                  </>
                )
              }}
            />
          )}
        />
      </Paper>
      <Collapse in={props.drawActive}>
        <Alert
          severity="info"
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => {
                props.toggleDraw(false);
              }}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
        >
          Markeringsverktyg aktiverat!
        </Alert>
      </Collapse>
      <SearchResultList
        map={map}
        searchResults={props.searchResults}
        resultsSource={props.resultsSource}
      />
    </div>
  );
};

export default SearchBar;
