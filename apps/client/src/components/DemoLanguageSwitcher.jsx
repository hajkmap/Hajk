import React from "react";
import { useTranslation } from "react-i18next";
import {
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { getAvailableLanguages, setLanguage } from "src/i18n";

// Language names in their own language, e.g. "svenska", "English".
const nativeName = (lng) => {
  try {
    return new Intl.DisplayNames([lng], { type: "language" }).of(lng) ?? lng;
  } catch {
    return lng;
  }
};

/**
 * Temporary language switcher, centered on the screen, for demoing i18n.
 */
export default function DemoLanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const languages = getAvailableLanguages();
  const current = i18n.resolvedLanguage || i18n.language;

  if (languages.length < 2) return null;

  return (
    <Paper
      elevation={6}
      sx={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: (theme) => theme.zIndex.modal - 1,
        p: 2,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1,
      }}
    >
      <Typography variant="subtitle1">
        {t("common.demoLanguageSwitch")}
      </Typography>
      <ToggleButtonGroup
        exclusive
        size="small"
        value={current}
        onChange={(_, lng) => lng && lng !== current && setLanguage(lng)}
      >
        {languages.map((lng) => (
          <ToggleButton key={lng} value={lng}>
            {nativeName(lng)}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Paper>
  );
}
