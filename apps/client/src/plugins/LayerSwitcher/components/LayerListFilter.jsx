import React, { useRef, useState } from "react";

import { IconButton, InputAdornment, TextField, Divider } from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";

import HajkToolTip from "components/HajkToolTip";
import LayersTabActionsMenu from "./LayersTabActionsMenu.jsx";

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
    <>
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
          variant="standard"
          sx={{ pt: 1.25, pb: 1, pl: 1.75, pr: 0.5 }}
          slotProps={{
            input: {
              disableUnderline: true,
              endAdornment: (
                <InputAdornment position="end">
                  {inputRef.current?.value.length >= minFilterLength ? (
                    <HajkToolTip title="Rensa sökning">
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
                    </HajkToolTip>
                  ) : (
                    <IconButton size="small" disabled>
                      <SearchIcon />
                    </IconButton>
                  )}
                  <LayersTabActionsMenu
                    scrollToTop={scrollToTop}
                    scrollToBottom={scrollToBottom}
                  />
                </InputAdornment>
              ),
            },
            formHelperText: {
              color: "red",
            },
          }}
        />
      </HajkToolTip>
      <Divider orientation="horizontal" flexItem />
    </>
  );
};
export default LayerListFilter;
