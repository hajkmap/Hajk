import React, { useEffect, useRef, useState } from "react";

import { Vector as VectorLayer } from "ol/layer";
import VectorSource from "ol/source/Vector";
import { Stroke, Style, Circle, Fill } from "ol/style";
import Draw from "ol/interaction/Draw";
import GeoJSON from "ol/format/GeoJSON";

import {
  CircularProgress,
  IconButton,
  Paper,
  TextField,
  Tooltip,
  makeStyles,
  Checkbox
} from "@material-ui/core";

import Autocomplete from "@material-ui/lab/Autocomplete";
import ToggleButton from "@material-ui/lab/ToggleButton";
import Divider from "@material-ui/core/Divider";

import MenuIcon from "@material-ui/icons/Menu";
import FormatSizeIcon from "@material-ui/icons/FormatSize";
import SearchIcon from "@material-ui/icons/Search";
import BrushTwoToneIcon from "@material-ui/icons/BrushTwoTone";
import WithinIcon from "@material-ui/icons/Adjust";
import IntersectsIcon from "@material-ui/icons/Toll";
import MoreHorizIcon from "@material-ui/icons/MoreHoriz";

import CheckBoxOutlineBlankIcon from "@material-ui/icons/CheckBoxOutlineBlank";
import CheckBoxIcon from "@material-ui/icons/CheckBox";
import InputAdornment from "@material-ui/core/InputAdornment";
import InputBase from "@material-ui/core/InputBase";

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
              {option.autocompleteEntry + " (" + option.dataset + ")"}
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
                  <IconButton
                    color="primary"
                    className={classes.iconButton}
                    aria-label="directions"
                  >
                    <MoreHorizIcon />
                  </IconButton>
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
