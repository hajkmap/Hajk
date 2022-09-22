import React from "react";
import { IconButton, Paper, Tooltip } from "@mui/material";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import { styled } from "@mui/material/styles";
import { useTranslation } from "react-i18next";

const StyledPaper = styled(Paper)(({ theme }) => ({
  marginBottom: theme.spacing(1),
}));

const StyledIconButton = styled(IconButton)(() => ({
  minWidth: "unset",
}));

/**
 * @summary Hides all visible layers
 *
 * @param {object} props
 * @returns {object} React
 */
const ThemeToggler = React.memo((props) => {
  const { t } = useTranslation();
  return (
    (props.showThemeToggler && (
      <Tooltip disableInteractive title={t("controls.themeToggler.title")}>
        <StyledPaper>
          <StyledIconButton
            aria-label={t("controls.themeToggler.ariaLabel")}
            onClick={(e) => {
              props.toggleMUITheme();
            }}
          >
            <Brightness4Icon />
          </StyledIconButton>
        </StyledPaper>
      </Tooltip>
    )) ||
    null
  );
});

export default ThemeToggler;
