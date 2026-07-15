import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import { Box, IconButton } from "@mui/material";

export type LayerSwitcherToggleState =
  | "unchecked"
  | "checked"
  | "semichecked"
  | "checkedWithWarning";

interface LayerSwitcherCheckboxProps {
  toggleState: LayerSwitcherToggleState;
  onClick?: (event: React.MouseEvent) => void;
  ariaLabel?: string;
}

export default function LayerSwitcherCheckbox({
  toggleState,
  onClick,
  ariaLabel,
}: LayerSwitcherCheckboxProps) {
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
      <CheckBoxOutlineBlankIcon fontSize="small" />
      <Box
        sx={[
          {
            position: "absolute",
            top: "50%",
            left: "50%",
            transition: "transform 200ms ease, opacity 200ms ease",
            lineHeight: 0,
            transform: "translate(-50%, -50%) scale(0)",
            opacity: 0,
          },
          toggleState !== "unchecked" && {
            transform: "translate(-50%, -50%) scale(1.05)",
            opacity: toggleState === "semichecked" ? 0.45 : 1,
          },
        ]}
      >
        <CheckBoxIcon
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
