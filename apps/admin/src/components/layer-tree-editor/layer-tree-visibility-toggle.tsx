import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import { Box, IconButton, Tooltip } from "@mui/material";

import type { LayerTreeToggleState } from "./layer-tree-settings";

interface LayerTreeVisibilityToggleProps {
  state: LayerTreeToggleState;
  /** A layer in an exclusive group: the client shows a radio button. */
  variant?: "checkbox" | "radio";
  label: string;
  disabled?: boolean;
  onClick?: () => void;
}

/**
 * Visible at start, as Lagerordning's box left of the name: checked,
 * unchecked, or half for a group with some of its layers on.
 */
export default function LayerTreeVisibilityToggle({
  state,
  variant = "checkbox",
  label,
  disabled = false,
  onClick,
}: LayerTreeVisibilityToggleProps) {
  const isRadio = variant === "radio";
  const OutlineIcon = isRadio
    ? RadioButtonUncheckedIcon
    : CheckBoxOutlineBlankIcon;
  const CheckedIcon = isRadio ? RadioButtonCheckedIcon : CheckBoxIcon;

  return (
    <Tooltip title={label}>
      <span>
        <IconButton
          size="small"
          aria-label={label}
          aria-pressed={state === "checked"}
          disabled={disabled}
          onClick={(event) => {
            event.stopPropagation();
            onClick?.();
          }}
          // Not the start of a drag.
          onMouseDown={(event) => event.stopPropagation()}
          sx={{ p: 0.25, position: "relative" }}
        >
          <OutlineIcon fontSize="small" />
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              lineHeight: 0,
              transform: `translate(-50%, -50%) scale(${state === "unchecked" ? 0 : 1})`,
              opacity: state === "semichecked" ? 0.45 : 1,
              transition: "transform 0.12s",
            }}
          >
            <CheckedIcon fontSize="small" color="primary" />
          </Box>
        </IconButton>
      </span>
    </Tooltip>
  );
}
