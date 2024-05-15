import React from "react";
import { IconButton, Paper } from "@mui/material";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import { styled } from "@mui/material/styles";
import HajkToolTip from "components/HajkToolTip";

const StyledPaper = styled(Paper)(({ theme }) => ({
  marginBottom: theme.spacing(1),
}));

const StyledIconButton = styled(IconButton)(({ theme }) => ({
  minWidth: "unset",
}));

/**
 * @summary Hides all visible layers
 *
 * @param {object} props
 * @returns {object} React
 */
const ThemeToggler = React.memo((props) => {
  return (
    (props.showThemeToggler && (
      <HajkToolTip title="Växla mellan mörkt och ljust färgtema">
        <StyledPaper>
          <StyledIconButton
            aria-label="Växla färgtema"
            onClick={(e) => {
              props.toggleMUITheme();
            }}
          >
            <Brightness4Icon />
          </StyledIconButton>
        </StyledPaper>
      </HajkToolTip>
    )) ||
    null
  );
});

export default ThemeToggler;
