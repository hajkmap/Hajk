import React, { useRef, useState } from "react";

import { Box, IconButton, InputAdornment, TextField } from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";

const LayerListFilter = ({ handleFilterValueChange, handleFilterSubmit }) => {
  const inputRef = useRef(null);

  const DEFAULT_MIN_FILTER_LENGTH = 3;
  const [helperText, setHelperTextState] = useState(null);
  const setHelperText = (value) => {
    if (value?.length > 0 && value?.length < DEFAULT_MIN_FILTER_LENGTH) {
      setHelperTextState("Skriv minst 3 tecken eller tryck enter");
    } else {
      setHelperTextState(null);
    }
  };

  return (
    <Box
      sx={{
        p: 2,
        backgroundColor: (theme) =>
          theme.palette.mode === "dark" ? "#373737" : theme.palette.grey[100],
        borderBottom: (theme) =>
          `${theme.spacing(0.2)} solid ${theme.palette.divider}`,
      }}
    >
      <TextField
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              {inputRef.current?.value && (
                <IconButton
                  onClick={() => {
                    if (inputRef.current) {
                      inputRef.current.value = "";
                      handleFilterValueChange("");
                      setHelperText("");
                    }
                  }}
                  size="small"
                >
                  <ClearIcon />
                </IconButton>
              )}
            </InputAdornment>
          ),
        }}
        size="small"
        onChange={(event) => {
          handleFilterValueChange(event.target.value);
          setHelperText(event.target.value);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            handleFilterSubmit(event.target.value);
          }
        }}
        fullWidth
        placeholder="Sök lager och grupper"
        helperText={helperText}
        FormHelperTextProps={{
          color: "red",
        }}
        inputRef={inputRef}
        variant="outlined"
        sx={{
          background: (theme) =>
            theme.palette.mode === "dark" ? "inherit" : "#fff",
          width: 500,
          maxWidth: "100%",
        }}
      />
    </Box>
  );
};
export default LayerListFilter;
