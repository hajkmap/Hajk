import React, { useRef } from "react";

import { Box, IconButton, InputAdornment, TextField } from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";

const LayerListFilter = ({ filterValue, handleFilterValueChange }) => {
  const inputRef = useRef(null);

  return (
    <Box
      sx={{
        p: 1,
        backgroundColor: (theme) =>
          theme.palette.mode === "dark" ? "#373737" : theme.palette.grey[100],
        borderBottom: (theme) =>
          `${theme.spacing(0.2)} solid ${theme.palette.divider}`,
      }}
    >
      <Box
        sx={{
          width: 500,
          maxWidth: "100%",
          p: 1,
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
          onChange={(event) => handleFilterValueChange(event.target.value)}
          fullWidth
          placeholder="Sök lager och grupper"
          inputRef={inputRef}
          variant="outlined"
          sx={{
            background: (theme) =>
              theme.palette.mode === "dark" ? "inherit" : "#fff",
          }}
        />
      </Box>
    </Box>
  );
};
export default LayerListFilter;
