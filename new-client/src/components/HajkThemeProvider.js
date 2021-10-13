import React, { useState } from "react";
import {
  ThemeProvider,
  StyledEngineProvider,
  createTheme,
} from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import App from "./App";

import { deepMerge } from "../utils/DeepMerge";

/**
 * @summary Helper, used to determine if user's browser prefers dark mode.
 *
 * @param {*} preferredColorSchemeFromMapConfig
 * @returns {String} "dark" or "light"
 */
function getColorScheme(preferredColorSchemeFromMapConfig, customTheme) {
  // First of all, see if admins have provided a customTheme.json, where
  // the light/dark mode value is set. If it is, this will override any
  // other logic, which means we're not interested in user's or OS's preference.
  if (["light", "dark"].includes(customTheme?.palette?.type)) {
    return customTheme.palette.mode;
  }

  // If there's no global override, we can go on and
  // check if there already is a user preferred value in local storage.
  const userPreferredColorScheme = window.localStorage.getItem(
    "userPreferredColorScheme"
  );

  let colorScheme = null; // Will hold the return value

  // If there's already a valid user preference in local storage…
  if (["light", "dark"].includes(userPreferredColorScheme)) {
    colorScheme = userPreferredColorScheme; // …use it.
  } else {
    // Else, find out what admin has set in map config…
    switch (
      preferredColorSchemeFromMapConfig // If setting in admin is…
    ) {
      case "dark": // …dark, use it,
        colorScheme = "dark";
        break;
      case "light": // …light, use it.
        colorScheme = "light";
        break;
      default:
        // If there's no preference yet in neither local storage nor admin…
        colorScheme =
          window?.matchMedia("(prefers-color-scheme: dark)").matches === true // …check if browser prefers dark mode…
            ? "dark" // …if so, use dark mode…
            : "light"; // … else go for light.
        break;
    }
  }

  return colorScheme;
}

/**
 * Helper function that creates a MUI theme by merging
 * hard-coded values (in this function), with custom values
 * (obtained from customTheme.json in /public).
 * This way, user can customize look and feel of application
 * AFTER it has been build with webpack, by simply tweaking
 * values in customTheme.json.
 *
 * @param {Object} config Map config that, among other objects, contains the default MUI theme
 * @param {Object} customTheme An object with the custom theme, obtained via fetch from customTheme.json
 * @returns {Object} A complete, ready to used theme object
 */
function getTheme(config, customTheme) {
  const colorScheme = getColorScheme(
    config.mapConfig.map.colors?.preferredColorScheme,
    customTheme
  );
  // Setup some app-wide defaults that differ from MUI's defaults:
  const hardCodedDefaults = {
    palette: {
      mode: colorScheme,
      action: {
        active: colorScheme === "dark" ? "#fff" : "rgba(0, 0, 0, 0.87)",
      },
    },
    shape: {
      borderRadius: 2,
    },
  };

  // Allow even more customization by reading values from each map config
  const themeFromMapConfig = {
    palette: {
      primary: {
        main: config.mapConfig.map.colors.primaryColor, // primary: blue // <- Can be done like this (don't forget to import blue from "@mui/material/colors/blue"!)
      },
      secondary: {
        main: config.mapConfig.map.colors.secondaryColor, // secondary: { main: "#11cb5f" } // <- Or like this
      },
    },
  };

  // Create the merged theme object by:
  const mergedTheme = deepMerge(
    hardCodedDefaults, // Using the hardcoded default…
    customTheme, // … overriding them with stuff from customTheme.json (app-wide customizations, common for each maps)…
    themeFromMapConfig // … and finally overriding them with map-specific customizations.
  );

  return mergedTheme;
}

const HajkThemeProvider = ({ activeTools, config, customTheme }) => {
  // Keep the app's theme in state so it can be changed dynamically.
  const [theme, setTheme] = useState(getTheme(config, customTheme));

  // Handles theme toggling
  const toggleMUITheme = () => {
    // If there's a override in customTheme.json, toggling is not possible.
    if (customTheme?.palette?.type) return;

    // Toggle the current value from theme's palette
    let userPreferredColorScheme =
      theme.palette.mode === "light" ? "dark" : "light";

    // Save for later in browser's local storage
    window.localStorage.setItem(
      "userPreferredColorScheme",
      userPreferredColorScheme
    );

    // Create a new theme object by taking the current theme
    // and merging with the latest theme type value
    const newTheme = deepMerge(theme, {
      palette: {
        mode: userPreferredColorScheme,
        action: {
          active:
            userPreferredColorScheme === "dark"
              ? "#fff"
              : "rgba(0, 0, 0, 0.87)",
        },
      },
    });

    // Finally, save the new theme object in state. This will cause re-render,
    // and effectively take the new theme type value into action.
    setTheme(newTheme);
  };

  // Take the theme object from state and generate a MUI-theme
  const muiTheme = createTheme(theme);

  // Render, pass through some stuff into App.
  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        <App
          activeTools={activeTools}
          config={config}
          theme={muiTheme}
          toggleMUITheme={toggleMUITheme} // Pass the toggle handler, so we can call it from another component later on
        />
      </ThemeProvider>
    </StyledEngineProvider>
  );
};

export default HajkThemeProvider;
