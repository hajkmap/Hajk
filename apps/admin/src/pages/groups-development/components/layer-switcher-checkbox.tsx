import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import { Box, IconButton } from "@mui/material";

export type LayerSwitcherToggleState =
  | "unchecked"
  | "checked"
  | "semichecked"
  | "checkedWithWarning";

interface LayerSwitcherCheckboxProps {
  toggleState: LayerSwitcherToggleState;
  /** Exclusive groups use radio-style controls for child items (visual only). */
  variant?: "checkbox" | "radio";
  onClick?: (event: React.MouseEvent) => void;
  ariaLabel?: string;
}

export default function LayerSwitcherCheckbox({
  toggleState,
  variant = "checkbox",
  onClick,
  ariaLabel,
}: LayerSwitcherCheckboxProps) {
  const isRadio = variant === "radio";
  const OutlineIcon = isRadio
    ? RadioButtonUncheckedIcon
    : CheckBoxOutlineBlankIcon;
  const CheckedIcon = isRadio ? RadioButtonCheckedIcon : CheckBoxIcon;

  return (
    <IconButton
      size="small"
      onClick={onClick}
      onMouseDown={(event) => {
        event.stopPropagation();
      }}
      aria-label={ariaLabel}
      sx={{
        p: 0.25,
        mt: 0.3,
        position: "relative",
        "&:hover": {
          backgroundColor: "transparent",
        },
      }}
    >
      <OutlineIcon fontSize="small" />
      <Box
        sx={[
          {
            position: "absolute",
            top: "50%",
            left: "50%",
            lineHeight: 0,
            transform: "translate(-50%, -50%) scale(0)",
            opacity: 0,
          },
          toggleState !== "unchecked" && {
            transform: "translate(-50%, -50%) scale(1)",
            opacity: toggleState === "semichecked" ? 0.45 : 1,
          },
        ]}
      >
        <CheckedIcon
          fontSize="small"
          sx={{
            ...(toggleState === "checkedWithWarning" && {
              fill: "warning.dark",
            }),
          }}
        />
      </Box>
    </IconButton>
  );
}
