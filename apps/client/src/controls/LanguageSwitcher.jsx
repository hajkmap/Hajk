import React, { useState } from "react";
import { Box, Menu, MenuItem } from "@mui/material";
import { useTranslation } from "react-i18next";

import ControlButton from "components/ControlButton";
import { getAvailableLanguages, setLanguage } from "src/i18n";

// Language names in their own language, capitalized, e.g. "Svenska", "English".
const nativeName = (lng) => {
  let name = lng;
  try {
    name = new Intl.DisplayNames([lng], { type: "language" }).of(lng) ?? lng;
  } catch {
    // Fall back to the language code.
  }
  return name.charAt(0).toLocaleUpperCase(lng) + name.slice(1);
};

/**
 * @summary Control button that opens a menu for switching language.
 * Hidden when only one language is available.
 *
 * @returns {object} React
 */
const LanguageSwitcher = () => {
  const { t, i18n } = useTranslation();
  const [anchorEl, setAnchorEl] = useState(null);
  const languages = getAvailableLanguages();
  const current = i18n.resolvedLanguage || i18n.language;

  if (languages.length < 2) return null;

  const handleItemClick = (lng) => {
    setAnchorEl(null);
    // Reloads the page with the new language.
    if (lng !== current) setLanguage(lng);
  };

  return (
    <>
      <ControlButton
        tooltip={t("controls.changeLanguage")}
        ariaLabel={t("controls.changeLanguage")}
        onClick={(event) => setAnchorEl(event.currentTarget)}
      >
        {/* Current language code instead of an icon, sized like one so the
            button matches the other controls. */}
        <Box
          component="span"
          aria-hidden="true"
          sx={{
            width: 24,
            height: 24,
            lineHeight: "24px",
            fontSize: "0.8rem",
            fontWeight: 600,
            textAlign: "center",
          }}
        >
          {current.toUpperCase()}
        </Box>
      </ControlButton>
      <Menu
        id="languageSwitcherMenu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        {languages.map((lng) => (
          <MenuItem
            key={lng}
            lang={lng}
            selected={lng === current}
            onClick={() => handleItemClick(lng)}
          >
            {nativeName(lng)}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default LanguageSwitcher;
