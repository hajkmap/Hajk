import React from "react";

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

  const tooltipText = menuButtonDisabled
    ? "Du måste först låsa upp verktygspanelen för kunna klicka på den här knappen. Tryck på hänglåset till vänster."
    : "Visa verktygspanelen";

  return (
    <div>
      <Paper className={classes.root}>
        <Autocomplete
          id="searchInputField"
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
      <SearchResultList {...props} />
    </div>
  );
};

export default SearchBar;
