import React, { useRef, useState } from "react";

import { Box, IconButton, InputAdornment, TextField } from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";

import HajkToolTip from "components/HajkToolTip";
import LayersTabActionsMenu from "./LayersTabActionsMenu.js";

const MIN_FILTER_TOOLTIP_DELAY = 1000;

const LayerListFilter = ({
  minFilterLength = 3,
  handleFilterValueChange,
  handleFilterSubmit,
  scrollToTop,
  scrollToBottom,
}) => {
  const inputRef = useRef(null);

  const [showToolTip, setShowToolTip] = useState(false);

  const updateTooltip = (value) => {
    if (value?.length > 0 && value?.length < minFilterLength) {
      setShowToolTip(true);
    } else {
      setShowToolTip(false);
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
        display: "flex",
        flexDirection: "row",
      }}
    >
      <HajkToolTip
        title={`Skriv minst ${minFilterLength} tecken eller tryck enter`}
        placement="right"
        enterDelay={MIN_FILTER_TOOLTIP_DELAY}
        open={showToolTip}
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
                        updateTooltip("");
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
            updateTooltip(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              handleFilterSubmit(event.target.value);
            }
          }}
          fullWidth
          placeholder="Sök lager och grupper"
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
      </HajkToolTip>
      <LayersTabActionsMenu
        scrollToTop={scrollToTop}
        scrollToBottom={scrollToBottom}
      />
    </Box>
  );
};
export default LayerListFilter;
