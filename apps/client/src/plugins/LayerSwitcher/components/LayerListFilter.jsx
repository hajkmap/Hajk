import { useRef, useState } from "react";

import { IconButton, InputAdornment, TextField, Divider } from "@mui/material";

import { isMobile } from "../../../utils/IsMobile";

import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";

import HajkToolTip from "components/HajkToolTip";
import LayersTabActionsMenu from "./LayersTabActionsMenu.jsx";
import i18n from "src/i18n";

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
        title={i18n.t("layerSwitcher.minFilterLength", {
          count: minFilterLength,
        })}
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
          onBlur={(_event) => {
            updateTooltip("");
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              handleFilterSubmit(event.target.value);
              if (isMobile) {
                // try to get rid of the keyboard on mobile.
                event.target.blur();
              }
            }
          }}
          fullWidth
          placeholder={i18n.t("layerSwitcher.searchLayers")}
          inputRef={inputRef}
          variant="standard"
          sx={{ pt: 1.25, pb: 1, pl: 1.75, pr: 0.5 }}
          slotProps={{
            input: {
              disableUnderline: true,
              endAdornment: (
                <InputAdornment position="end">
                  {inputRef.current?.value.length >= minFilterLength ? (
                    <HajkToolTip title={i18n.t("search.clearSearch")}>
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
