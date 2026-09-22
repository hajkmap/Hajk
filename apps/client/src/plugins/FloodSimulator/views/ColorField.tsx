import { useId, useRef, useState } from "react";

import { Box, FormControlLabel, Popover } from "@mui/material";
import { ChromePicker } from "react-color";

interface ColorFieldProps {
  color: string;
  label: string;
  onChange: (hex: string) => void;
}

function ColorField({ color, label, onChange }: ColorFieldProps) {
  const [draft, setDraft] = useState(color);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const draftRef = useRef(color);
  const popoverId = useId();
  const open = anchorEl !== null;

  const close = () => {
    setAnchorEl(null);
    // Commit once, when the popover closes. ChromePicker's onChange fires on
    // every drag.
    onChange(draftRef.current);
  };

  return (
    <>
      <FormControlLabel
        control={
          <Box
            aria-controls={open ? popoverId : undefined}
            aria-expanded={open}
            aria-haspopup="dialog"
            aria-label={label}
            component="button"
            onClick={(event) => {
              if (anchorEl) {
                close();
                return;
              }
              draftRef.current = color;
              setDraft(color);
              setAnchorEl(event.currentTarget);
            }}
            sx={{
              width: 24,
              height: 24,
              ml: 1,
              mr: 1,
              p: 0,
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 0.5,
              bgcolor: open ? draft : color,
              cursor: "pointer",
              flexShrink: 0,
              "&:focus-visible": {
                outline: "2px solid",
                outlineColor: "primary.main",
                outlineOffset: 1,
              },
            }}
            type="button"
          />
        }
        label={label}
        labelPlacement="end"
        sx={{ mr: 0 }}
      />
      <Popover
        anchorEl={anchorEl}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        id={popoverId}
        // The popover is portaled, but the event still bubbles to the
        // draggable plugin window. Without this, choosing a color drags the
        // window and the click that should close the popover is lost.
        onMouseDown={(event) => {
          event.stopPropagation();
        }}
        onClose={close}
        open={open}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
        transitionDuration={0}
      >
        <ChromePicker
          color={draft}
          disableAlpha
          onChange={(next) => {
            draftRef.current = next.hex;
            setDraft(next.hex);
          }}
          styles={{
            default: {
              picker: {
                boxShadow: "none",
              },
            },
          }}
        />
      </Popover>
    </>
  );
}

export default ColorField;
