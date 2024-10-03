import { IconButton, useTheme } from "@mui/material";
import { SIDEBAR_MINI_WIDTH } from "../../constants";

interface Props {
  sx?: object;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  children: React.ReactNode;
}

const SquareIconButton = (props: Props) => {
  const { palette } = useTheme();
  return (
    <IconButton
      onClick={props.onClick}
      onMouseEnter={props.onMouseEnter}
      onMouseLeave={props.onMouseLeave}
      size="large"
      disableRipple={false}
      focusRipple={false}
      sx={{
        color: palette.text.primary,
        width: `${SIDEBAR_MINI_WIDTH}px`,
        height: `${SIDEBAR_MINI_WIDTH}px`,
        padding: "6px",
        borderRadius: 0,
        ...props.sx,
      }}
    >
      {props.children}
    </IconButton>
  );
};

export default SquareIconButton;
