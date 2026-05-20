import { IconButton, Paper } from "@mui/material";
import { styled } from "@mui/material/styles";
import HajkToolTip from "components/HajkToolTip";

const StyledPaper = styled(Paper)(({ theme }) => ({
  marginBottom: theme.spacing(1),
}));

export const StyledControlButton = styled(IconButton)(({ theme }) => ({
  minWidth: "unset",
  // Tried to set this the "correct" MUI way in the custom theme, but it didn't work after trying for x hours.
  borderRadius: `${theme.shape.borderRadius}px`,
  ".MuiTouchRipple-root": {
    borderRadius: `${theme.shape.borderRadius}px !important`,
  },
  ".MuiTouchRipple-child": {
    borderRadius: `${theme.shape.borderRadius}px !important`,
  },
}));

const ControlButton = ({ tooltip, ariaLabel, onClick, children, ...rest }) => {
  return (
    <HajkToolTip title={tooltip} placement="left">
      <StyledPaper>
        <StyledControlButton aria-label={ariaLabel} onClick={onClick} {...rest}>
          {children}
        </StyledControlButton>
      </StyledPaper>
    </HajkToolTip>
  );
};

export default ControlButton;
