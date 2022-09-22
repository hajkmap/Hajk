import React from "react";
import { IconButton, Menu, MenuItem, Paper, Tooltip } from "@mui/material";
import LanguageIcon from "@mui/icons-material/Language";

import { styled } from "@mui/material/styles";
import { useTranslation } from "react-i18next";

const StyledPaper = styled(Paper)(({ theme }) => ({
  marginBottom: theme.spacing(1),
}));

const StyledIconButton = styled(IconButton)(({ theme }) => ({
  minWidth: "unset",
}));

const LanguageSwitcher = React.memo((props) => {
  const { t, i18n } = useTranslation();
  const [anchor, setAnchor] = React.useState(null);

  const languages = [
    {
      code: "sv",
      displayName: t("controls.languageSwitcher.menu.menuItems.swedish"),
    },
    {
      code: "en",
      displayName: t("controls.languageSwitcher.menu.menuItems.english"),
    },
  ];

  const renderLanguages = () => {
    return languages.map((language, index) => {
      return (
        <MenuItem
          key={index}
          selected={language.code === i18n.language}
          onClick={() => {
            setAnchor(null);
            window.localStorage.setItem("userPreferredLanguage", language.code);
            i18n.changeLanguage(language.code);
          }}
        >
          {language.displayName}
        </MenuItem>
      );
    });
  };

  return (
    (props.showExperimentalLanguageSwitcher && (
      <>
        <Tooltip title={t("controls.languageSwitcher.iconButton.tooltip")}>
          <StyledPaper>
            <StyledIconButton
              aria-label={t("controls.languageSwitcher.iconButton.ariaLabel")}
              onClick={(e) => setAnchor(!anchor ? e.currentTarget : null)}
            >
              <LanguageIcon />
            </StyledIconButton>
          </StyledPaper>
        </Tooltip>
        <Menu
          id="render-props-menu"
          anchorEl={anchor}
          open={Boolean(anchor)}
          onClose={() => setAnchor(null)}
        >
          {renderLanguages(props)}
        </Menu>
      </>
    )) ||
    null
  );
});

export default LanguageSwitcher;
