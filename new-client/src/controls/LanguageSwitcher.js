import React from "react";
import { Button, Menu, MenuItem, Paper, Tooltip } from "@material-ui/core";
import LanguageIcon from "@material-ui/icons/Language";
import { makeStyles } from "@material-ui/styles";
import { useTranslation } from "react-i18next";

const useStyles = makeStyles((theme) => ({
  paper: {
    marginBottom: theme.spacing(1),
  },
  button: {
    minWidth: "unset",
  },
}));

const LanguageSwitcher = React.memo((props) => {
  const classes = useStyles();
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
        <Tooltip title="Växla språk">
          <Paper className={classes.paper}>
            <Button
              aria-label="Växla språk"
              className={classes.button}
              onClick={(e) => setAnchor(!anchor ? e.currentTarget : null)}
            >
              <LanguageIcon />
            </Button>
          </Paper>
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
