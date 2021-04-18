import React from "react";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import translationsEN from "../i18n/en/en.json";
import translationsSV from "../i18n/sv/sv.json";

const resources = {
  en: {
    translation: translationsEN,
  },
  sv: {
    translation: translationsSV,
  },
};

const HajkLanguageProvider = ({ config }) => {
  const [i18nHasInitiated, setI18nHasInitiated] = React.useState(false);

  const getLanguage = () => {
    return (
      window.localStorage.getItem("userPreferredLanguage") ??
      config.appConfig.lang
    );
  };

  const initI18n = () => {
    if (!i18nHasInitiated) {
      setI18nHasInitiated(true);
      i18n.use(initReactI18next).init({
        resources,
        lng: getLanguage(),
        debug: true,
        fallbackLng: "en",
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
