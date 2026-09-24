import { useState } from "react";
import {
  Box,
  InputAdornment,
  Popover,
  TextField,
  type TextFieldProps,
} from "@mui/material";
import { lighten } from "@mui/material/styles";
import { SketchPicker } from "react-color";

interface FormColorPickerProps {
  label?: string;
  value: string;
  onChange: (hex: string) => void;
  fullWidth?: boolean;
  size?: TextFieldProps["size"];
  placeholder?: string;
  disabled?: boolean;
}

export default function FormColorPicker({
  label,
  value,
  onChange,
  fullWidth = true,
  size = "small",
  placeholder,
  disabled,
}: FormColorPickerProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  return (
    <>
      <TextField
        label={label}
        fullWidth={fullWidth}
        size={size}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Box
                  onClick={(e) => {
                    if (disabled) return;
                    setAnchorEl(anchorEl ? null : e.currentTarget);
                  }}
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: "4px",
                    backgroundColor: value || "transparent",
                    border: value ? "none" : "1px dashed rgba(0,0,0,0.3)",
                    cursor: disabled ? "not-allowed" : "pointer",
                    opacity: disabled ? 0.5 : 1,
                  }}
                />
              </InputAdornment>
            ),
          },
        }}
      />
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => {
          // Blur first so MUI's aria-hidden doesn't land on a focused descendant.
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
          }
          setAnchorEl(null);
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{ paper: { sx: { overflow: "visible" } } }}
      >
        <Box
          sx={(theme) => ({
            ...(theme.palette.mode === "dark" && {
              "& .sketch-picker": {
                backgroundColor: `${lighten(
                  theme.palette.background.paper,
                  0.15
                )} !important`,
                border: `1px solid ${lighten(
                  theme.palette.background.paper,
                  0.3
                )} !important`,
                boxShadow: "none !important",
              },
              "& .sketch-picker input": {
                backgroundColor: `${lighten(
                  theme.palette.background.paper,
                  0.15
                )} !important`,
                color: `${theme.palette.text.primary} !important`,
                border: `1px solid ${lighten(
                  theme.palette.background.paper,
                  0.5
                )} !important`,
                boxShadow: "none !important",
              },
              "& .sketch-picker label": {
                color: `${theme.palette.text.primary} !important`,
              },
            }),
          })}
        >
          <SketchPicker
            color={value || "#ffffff"}
            onChangeComplete={(c) => onChange(c.hex)}
          />
        </Box>
      </Popover>
    </>
  );
}
