import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import sv from "./i18n/sv.json";
import en from "./i18n/en.json";

const resources = {
  en: en,
  sv: sv,
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "sv",
    interpolation: {
      escapeValue: false,
    },
  })
  .catch((error) => {
    console.error(error);
  });

export default i18n;
