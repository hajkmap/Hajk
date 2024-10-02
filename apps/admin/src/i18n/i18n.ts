import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import sv from "./translations/sv.json";
import en from "./translations/en.json";

export const LANGUAGES = {
  SV: "sv",
  EN: "en",
} as const;

export type Language = (typeof LANGUAGES)[keyof typeof LANGUAGES];

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
