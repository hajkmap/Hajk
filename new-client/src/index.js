// IE 11 starts here.
// If you don't need IE 11, comment out those lines line.
// Also, change 'browserlist' in package.json to exclude ie11.
import "react-app-polyfill/ie11";
import "react-app-polyfill/stable";
import "abortcontroller-polyfill/dist/polyfill-patch-fetch";
// IE 11 ends here.

import "ol/ol.css";
import "./custom-ol.css";

import registerServiceWorker from "./registerServiceWorker";

import React from "react";
import ReactDOM from "react-dom";
import App from "./components/App.js";
import buildConfig from "./buildConfig.json";
import { deepMerge } from "./utils/DeepMerge";
import CssBaseline from "@material-ui/core/CssBaseline";
import { createMuiTheme } from "@material-ui/core/styles";
import { ThemeProvider } from "@material-ui/styles";
import ErrorIcon from "@material-ui/icons/Error";

const networkErrorMessage =
  "Fel när applikationen skulle läsas in. Detta beror troligtvis på ett nätverksfel. Försök igen senare.";
const parseErrorMessage =
  "Fel när applikationen skulle läsas in. Detta beror troligtvis på ett konfigurationsfel. Försök igen senare.";

const fetchConfig = {
  credentials: "same-origin"
};

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
  // Standard behavior is to use colors from current map config
  // and make them primary and secondary colors for MUI theme.
  const hardCodedDefaults = {
    palette: {
      primary: {
        main: config.mapConfig.map.colors.primaryColor // primary: blue // <- Can be done like this (don't forget to import blue from "@material-ui/core/colors/blue"!)
      },
      secondary: {
        main: config.mapConfig.map.colors.secondaryColor // secondary: { main: "#11cb5f" } // <- Or like this
      }
    }
  };

  const mergedTheme = deepMerge(hardCodedDefaults, customTheme);
  return createMuiTheme(mergedTheme);
}

/**
 * Entry point to Hajk.
 * We start with a fetching appConfig.json, that is expected
 * to be located in the same directory as index.js.
 *
 * appConfig.json includes URL to the backend application (called MapService),
 * as well as the default preferred map configuration's file name.
 */
fetch("appConfig.json", fetchConfig)
  .then(appConfigResponse => {
    appConfigResponse.json().then(appConfig => {
      // Get default map's file name from appConfig
      let defaultMap = appConfig.defaultMap;

      // It is possible to override default map on request.
      // It is done using a query parameter called "m". Below
      // we check for its existance and read its value.
      window.location.search
        .replace("?", "")
        .split("&")
        .forEach(pair => {
          if (pair !== "") {
            let keyValue = pair.split("=");
            if (keyValue[0] === "m") {
              defaultMap = keyValue[1];
            }
          }
        });

      // Next, we do 3 necessary requests to MapService
      Promise.all([
        // Get all layers defined in MapService
        fetch(
          `${appConfig.proxy}${appConfig.mapserviceBase}/config/layers`,
          fetchConfig
        ),
        // Get the specific, requested map configuration
        fetch(
          `${appConfig.proxy}${appConfig.mapserviceBase}/config/${defaultMap}`,
          fetchConfig
        ),
        // Additionally, we fetch a custom theme that allows site admins to override
        // the default MUI theme without re-compiling the application.
        fetch("customTheme.json", fetchConfig)
      ])
        .then(
          ([layersConfigResponse, mapConfigResponse, customThemeResponse]) => {
            Promise.all([
              layersConfigResponse.json(),
              mapConfigResponse.json(),
              customThemeResponse.json()
            ])
              .then(([layersConfig, mapConfig, customTheme]) => {
                // The fetched files are decoded to Objects and placed in
                // another object, @name config.
                var config = {
                  appConfig: appConfig,
                  layersConfig: layersConfig,
                  mapConfig: mapConfig,
                  activeMap: defaultMap
                };

                let theme = getTheme(config, customTheme);

                // Invoke React's renderer
                ReactDOM.render(
                  // Wrap it all in a MUI Theme object
                  <ThemeProvider theme={theme}>
                    <CssBaseline />
                    {/* See App.js's constructor() and render() to further investigate the App's flow */}
                    <App
                      activeTools={buildConfig.activeTools}
                      config={config}
                    />
                  </ThemeProvider>,
                  document.getElementById("root")
                );

                registerServiceWorker();
              })
              .catch(err => {
                console.error("Parse error: ", err);
                ReactDOM.render(
                  <div className="start-error">
                    <div>
                      <ErrorIcon />
                    </div>
                    <div>{parseErrorMessage}</div>
                  </div>,
                  document.getElementById("root")
                );
              });
          }
        )
        .catch(err => {
          console.error("Network error: ", err);
          ReactDOM.render(
            <div className="start-error">
              <div>
                <ErrorIcon />
              </div>
              <div>{networkErrorMessage}</div>
            </div>,
            document.getElementById("root")
          );
        });
    });
  })
  .catch(err => {
    console.error("Network error: ", err);
    ReactDOM.render(
      <div className="start-error">
        <div>
          <ErrorIcon />
        </div>
        <div>{networkErrorMessage}</div>
      </div>,
      document.getElementById("root")
    );
  });
