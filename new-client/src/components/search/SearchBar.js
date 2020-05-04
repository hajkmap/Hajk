import React, { useEffect, useRef, useState } from "react";

import SearchTools from "./SearchTools";

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
  //const searchModel = props.app.appModel.searchModel;

  // Autocomplete state
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const loading = open && options.length === 0;

  const tooltipText = menuButtonDisabled
    ? "Du måste först låsa upp verktygspanelen för kunna klicka på den här knappen. Tryck på hänglåset till vänster."
    : "Visa verktygspanelen";

  useEffect(() => {});

  return (
    <Paper className={classes.root}>
      <Autocomplete
        id="searchbox"
        freeSolo
        clearOnEscape
        style={{ width: 500 }}
        options={props.autocompleteList}
        onInput={props.handleOnInput}
        onChange={props.handleOnChange}
        getOptionSelected={(option, value) =>
          option.autocompleteEntry === value.autocompleteEntry
        }
        getOptionLabel={option => option?.autocompleteEntry || option}
        groupBy={option => option.dataset}
        loading={loading}
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
                    onClick={props.handleOnSearch}
                  >
                    <SearchIcon />
                  </IconButton>
                  <Divider className={classes.divider} orientation="vertical" />
                  <SearchTools />
                </>
              )
            }}
          />
        )}
      />
    </Paper>
  );
};

export default SearchBar;
