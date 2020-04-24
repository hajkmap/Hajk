import React from "react";
import Autocomplete from "@material-ui/lab/Autocomplete";
import { Paper, TextField } from "@material-ui/core";

const SearchBar = props => {
  return (
    <Paper>
      <Autocomplete
        id="searchbox"
        autoHighlight
        freeSolo
        clearOnEscape
        style={{ width: 500 }}
        onInput={props.updateInput}
        onChange={props.updateChange}
        getOptionSelected={(option, value) =>
          option.autocompleteEntry === value.autocompleteEntry
        }
        options={props.autocompleteList.map(option => option.autocompleteEntry)}
        groupBy={option => option.dataset}
        renderInput={params => (
          <TextField
            {...params}
            label={undefined}
            margin="normal"
            variant="outlined"
            placeholder="Skriv eller välj bland förslagen nedan..."
          />
        )}
      />
    </Paper>
  );
};

export default SearchBar;
