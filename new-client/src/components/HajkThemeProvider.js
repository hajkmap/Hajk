import React, { useState } from "react";
import { MuiThemeProvider, createMuiTheme } from "@material-ui/core/styles";
import CssBaseline from "@material-ui/core/CssBaseline";
import App from "./App";

import { deepMerge } from "../utils/DeepMerge";

/**
 * @summary Helper, used to determine if user's browser prefers dark mode.
 *
 * @param {*} preferredColorSchemeFromMapConfig
 * @returns {String} "dark" or "light"
 */
function getColorScheme(preferredColorSchemeFromMapConfig) {
  // First, check if there already is a user preferred value in local storage
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
  // Setup some app-wide defaults that differ from MUI's defaults:
  const hardCodedDefaults = {
    palette: {
      type: getColorScheme(config.mapConfig.map.colors?.preferredColorScheme),
    },
    shape: {
      borderRadius: 2,
    },
  };

  // Allow even more customization by reading values from each map config
  const themeFromMapConfig = {
    palette: {
      primary: {
        main: config.mapConfig.map.colors.primaryColor, // primary: blue // <- Can be done like this (don't forget to import blue from "@material-ui/core/colors/blue"!)
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
    // Toggle the current value from theme's palette
    let userPreferredColorScheme =
      theme.palette.type === "light" ? "dark" : "light";

    // Save for later in browser's local storage
    window.localStorage.setItem(
      "userPreferredColorScheme",
      userPreferredColorScheme
    );

    // Create a new theme object by taking the current theme
    // and merging with the latest theme type value
    const newTheme = deepMerge(theme, {
      palette: {
        type: userPreferredColorScheme,
      },
    });

    // Finally, save the new theme object in state. This will cause re-render,
    // and effectively take the new theme type value into action.
    setTheme(newTheme);
  };

  // Take the theme object from state and generate a MUI-theme
  const muiTheme = createMuiTheme(theme);

  // Render, pass through some stuff into App.
  return (
    <MuiThemeProvider theme={muiTheme}>
      <CssBaseline />
      <App
        activeTools={activeTools}
        config={config}
        customTheme={customTheme}
        toggleMUITheme={toggleMUITheme} // Pass the toggle handler, so we can call it from another component later on
      />
    </MuiThemeProvider>
  );
};

export default HajkThemeProvider;
