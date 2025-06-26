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
      sx={(theme) => ({
        p: 2,
        backgroundColor: theme.palette.grey[100],
        borderBottom: `${theme.spacing(0.2)} solid ${theme.palette.divider}`,
        display: "flex",
        flexDirection: "row",
        ...theme.applyStyles("dark", {
          backgroundColor: "#373737",
        }),
      })}
    >
      <HajkToolTip
        title={`Skriv minst ${minFilterLength} tecken eller tryck enter`}
        placement="right"
        enterDelay={MIN_FILTER_TOOLTIP_DELAY}
        open={showToolTip}
      >
        <TextField
          size="small"
          onChange={(event) => {
            handleFilterValueChange(event.target.value);
            updateTooltip(event.target.value);
          }}
          onFocus={(event) => {
            if (event.target.value?.length > 0) {
              updateTooltip(event.target.value);
            }
          }}
          onBlur={(event) => {
            updateTooltip("");
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              handleFilterSubmit(event.target.value);
            }
          }}
          fullWidth
          placeholder="Sök lager"
          inputRef={inputRef}
          variant="outlined"
          sx={(theme) => ({
            background: "#fff",
            width: "calc(100% - 39px)",
            maxWidth: "100%",
            ...theme.applyStyles("dark", {
              background: theme.palette.grey[900],
            }),
          })}
          slotProps={{
            input: {
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
            },

            formHelperText: {
              color: "red",
            },
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
