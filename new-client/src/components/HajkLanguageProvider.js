import React from "react";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import translationsEN from "../i18n/en.json";
import translationsSV from "../i18n/sv.json";
import translationsBG from "../i18n/bg.json";

const resources = {
  en: {
    translation: translationsEN,
  },
  sv: {
    translation: translationsSV,
  },
  bg: {
    translation: translationsBG,
  },
};

const HajkLanguageProvider = ({ config }) => {
  const [i18nHasInitiated, setI18nHasInitiated] = React.useState(false);

  const getLanguage = () => {
    // If the language switcher is active we try to get the user preferred language from localStorage
    return config.appConfig.showExperimentalLanguageSwitcher
      ? window.localStorage.getItem("userPreferredLanguage") ??
          config.appConfig.lang // If userPreferredLanguage is not set in ls we fall back on config
      : config.appConfig.lang; // If the language switcher is disabled we use the language from the config
  };

  const initI18n = () => {
    if (!i18nHasInitiated) {
      setI18nHasInitiated(true);
      i18n.use(initReactI18next).init({
        resources,
        lng: getLanguage(),
        debug: true,
        fallbackLng: "sv",
        keySeparator: ".",
        interpolation: {
          escapeValue: false,
        },
      });
    }
  };

  initI18n();

  return null;
};

export default HajkLanguageProvider;
