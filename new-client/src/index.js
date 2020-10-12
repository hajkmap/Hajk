// IE 11 starts here.
// If you don't need IE 11, comment out those lines line.
// Also, change 'browserslist' in package.json to exclude ie11.
import "react-app-polyfill/ie11";
import "react-app-polyfill/stable";
import "abortcontroller-polyfill/dist/polyfill-patch-fetch";
import "allsettled-polyfill";
// IE 11 ends here.

import "ol/ol.css";
import "./custom-ol.css";

import * as serviceWorker from "./serviceWorker";

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

const fetchOpts = {
  credentials: "same-origin",
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
        main: config.mapConfig.map.colors.primaryColor, // primary: blue // <- Can be done like this (don't forget to import blue from "@material-ui/core/colors/blue"!)
      },
      secondary: {
        main: config.mapConfig.map.colors.secondaryColor, // secondary: { main: "#11cb5f" } // <- Or like this
      },
    },
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
fetch("appConfig.json", fetchOpts)
  .then((appConfigResponse) => {
    appConfigResponse.json().then((appConfig) => {
      // Grab URL params using the new URL API, save for later
      const urlParams = new URL(window.location).searchParams;

      // If m param is supplied, try loading a map with that name
      // or else, fall back to default from appConfig.json
      let activeMap = urlParams.has("m")
        ? urlParams.get("m")
        : appConfig.defaultMap;

      // Declare fetchMapConfig() that we'll use later on.
      //
      // The name of map config to fetch comes from appConfig.json's "defaultMap"
      // parameter, but it can be overridden by the "m" URL param.
      //
      // This can lead to a number of problems when users specify non-existing
      // map configs or if a map config's name has been changed.
      //
      // To avoid this, we first try to fetch the user-specified file,
      // but if that fails, we fall back to the hard-coded "defaultMap".
      const fetchMapConfig = async () => {
        // This saves us some keystrokes later on…
        const configUrl = `${appConfig.proxy}${appConfig.mapserviceBase}/config`;
        try {
          // Try to fetch user-specified config. Return it if OK.
          return await fetch(`${configUrl}/${activeMap}`, fetchOpts);
        } catch {
          // If the previous attempt fails reset "activeMap" to hard-coded value…
          activeMap = appConfig.defaultMap;
          // …and fetch again.
          return await fetch(`${configUrl}/${activeMap}`, fetchOpts);
        }
      };

      // Next, we do 3 necessary requests to MapService
      Promise.all([
        // Get all layers defined in MapService
        fetch(
          `${appConfig.proxy}${appConfig.mapserviceBase}/config/layers`,
          fetchOpts
        ),
        // Get the specific, requested map configuration
        fetchMapConfig(),
        // Additionally, we fetch a custom theme that allows site admins to override
        // the default MUI theme without re-compiling the application.
        fetch("customTheme.json", fetchOpts),
      ])
        .then(
          ([layersConfigResponse, mapConfigResponse, customThemeResponse]) => {
            Promise.all([
              layersConfigResponse.json(),
              mapConfigResponse.json(),
              customThemeResponse.json(),
            ])
              .then(([layersConfig, mapConfig, customTheme]) => {
                // The fetched files are decoded to Objects and placed in
                // another object, @name config.
                const config = {
                  activeMap: activeMap,
                  appConfig: appConfig,
                  layersConfig: layersConfig,
                  mapConfig: mapConfig,
                  urlParams,
                };

                // Make sure that the current user is allowed to display the current map
                const layerSwitcherConfig = config.mapConfig.tools.find(
                  (tool) => tool.type === "layerswitcher"
                );
                if (layerSwitcherConfig === undefined) {
                  throw new Error(
                    "noLayerSwitcher: " +
                      (config.appConfig.noLayerSwitcherMessage === undefined
                        ? "This map has no layerSwitcher indicating that you are not allowed to use this map!"
                        : config.appConfig.noLayerSwitcherMessage)
                  );
                }

                // Invoke React's renderer
                ReactDOM.render(
                  // Wrap it all in a MUI Theme object
                  <ThemeProvider theme={getTheme(config, customTheme)}>
                    <CssBaseline />
                    {/* See App.js's constructor() and render() to further investigate the App's flow */}
                    <App
                      activeTools={buildConfig.activeTools}
                      config={config}
                    />
                  </ThemeProvider>,
                  document.getElementById("root")
                );
              })
              .catch((err) => {
                console.error("Parse error: ", err.message);
                let errMsg = parseErrorMessage;
                if (err.message.startsWith("noLayerSwitcher:")) {
                  errMsg = err.message.substr(err.message.indexOf(":") + 2);
                }
                const html = { __html: errMsg };
                ReactDOM.render(
                  <div className="start-error">
                    <div>
                      <ErrorIcon />
                    </div>
                    <div dangerouslySetInnerHTML={html} />
                  </div>,
                  document.getElementById("root")
                );
              });
          }
        )
        .catch((err) => {
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
  .catch((err) => {
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

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
