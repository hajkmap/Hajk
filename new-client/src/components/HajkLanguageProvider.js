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

function getLanguage(config) {
  const userPreferredLanguage = window.localStorage.getItem(
    "userPreferredLanguage"
  );
  return userPreferredLanguage ?? config.appConfig.lang ?? "en";
}

const HajkLanguageProvider = ({ config }) => {
  const initI18n = () => {
    i18n.use(initReactI18next).init({
      resources,
      lng: getLanguage(config),
      fallbackLng: "en",
      keySeparator: ".",
      interpolation: {
        escapeValue: false,
      },
    });
  };

  return <>{initI18n()}</>;
};

export default HajkLanguageProvider;
