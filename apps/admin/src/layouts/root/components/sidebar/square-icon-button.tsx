import { IconButton, useTheme } from "@mui/material";
import { forwardRef } from "react";
import { SIDEBAR_MINI_WIDTH } from "../../constants";

interface Props {
  sx?: object;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  children: React.ReactNode;
}

const SquareIconButton = forwardRef<HTMLButtonElement, Props>(
  ({ sx, onClick, onMouseEnter, onMouseLeave, children, ...rest }, ref) => {
    const { palette } = useTheme();

    return (
      <IconButton
        ref={ref}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        size="large"
        disableRipple={false}
        focusRipple={false}
        sx={{
          color: palette.text.primary,
          width: `${SIDEBAR_MINI_WIDTH}px`,
          height: `${SIDEBAR_MINI_WIDTH}px`,
          padding: "6px",
          borderRadius: 0,
          ...sx,
        }}
        {...rest}
      >
        {children}
      </IconButton>
    );
  }
);

SquareIconButton.displayName = "SquareIconButton";

export default SquareIconButton;
