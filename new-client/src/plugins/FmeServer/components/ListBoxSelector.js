import React from "react";
import { FormControl, InputLabel } from "@mui/material";
import { Grid, Select, Chip, MenuItem } from "@mui/material";
import { styled } from "@mui/material/styles";

const ChipsContainer = styled("div")(() => ({
  display: "flex",
  flexWrap: "wrap",
}));

const StyledChip = styled(Chip)(() => ({
  marginRight: 2,
}));

const ListBoxSelector = (props) => {
  const { parameter, index, onChange } = props;

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

  // Finds the option connected to the supplied value and returns it's
  // corresponding caption.
  function getOptionCaption(value) {
    // Let's start by grabbing the option
    const currentOption = parameter.listOptions.find((option) => {
      return option.value === value;
    });
    // And then return the caption.
    return currentOption.caption;
  }

  return (
    <Grid container item xs={12} sx={{ padding: 1 }}>
      <FormControl size="small" fullWidth required={!parameter.optional}>
        <InputLabel variant="outlined" id={`fme-listbox-label-${index}`}>
          {parameter.description}
        </InputLabel>
        <Select
          multiple
          value={getSelectedItems()}
          onChange={(event) => onChange(event.target.value, index)}
          input={
            <Select
              labelId={`fme-listbox-label-${index}`}
              label={parameter.description}
              variant="outlined"
            />
          }
          renderValue={(selected) => (
            <ChipsContainer>
              {selected.map((value, index) => (
                <StyledChip
                  key={index}
                  label={getOptionCaption(value)}
                  size="small"
                />
              ))}
            </ChipsContainer>
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
