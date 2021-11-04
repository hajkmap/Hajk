import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import { FormControl, InputLabel } from "@material-ui/core";
import { Grid, Select, Chip, MenuItem } from "@material-ui/core";

const useStyles = makeStyles(() => ({
  chips: {
    display: "flex",
    flexWrap: "wrap",
  },
  chip: {
    marginRight: 2,
  },
}));

const ListBoxSelector = (props) => {
  const { parameter, index, onChange } = props;
  const classes = useStyles();

  // Returns an array of items currently selected
  function getSelectedItems() {
    // If the user hasn't chosen yet, we return the default value
    if (!parameter.value) {
      return parameter.defaultValue;
    }
    // Otherwise we get the chosen listOption-values
    // (We dont want the full objects, only the value).
    return parameter.listOptions.reduce((acc, next) => {
      // So if the value is in the selected values
      // we push it to the return array.
      if (parameter.value.includes(next.value)) {
        acc.push(next.value);
      }
      return acc;
    }, []);
  }

  return (
    <Grid container item xs={12} style={{ padding: 8 }}>
      <FormControl size="small" fullWidth>
        <InputLabel variant="outlined" id={`fme-listbox-label-${index}`}>
          {parameter.description}
        </InputLabel>
        <Select
          multiple
          value={getSelectedItems()}
          onChange={(event) =>
            onChange(event.target.value, index, parameter.type)
          }
          input={
            <Select
              labelId={`fme-listbox-label-${index}`}
              label={parameter.description}
              variant="outlined"
            />
          }
          renderValue={(selected) => (
            <div className={classes.chips}>
              {selected.map((option, index) => (
                <Chip
                  key={index}
                  label={option}
                  size="small"
                  className={classes.chip}
                />
              ))}
            </div>
          )}
        >
          {parameter.listOptions.map((option, index) => (
            <MenuItem key={index} value={option.value}>
              {option.caption}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Grid>
  );
};

export default ListBoxSelector;
