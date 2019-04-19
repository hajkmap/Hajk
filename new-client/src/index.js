// IE 11 starts here.
// If you don't need IE 11, comment out those lines line.
// Also, change 'browserlist' in package.json to exclude ie11.
import "@babel/polyfill";
import "react-app-polyfill/ie11";
import "abortcontroller-polyfill/dist/polyfill-patch-fetch";
// IE 11 ends here.

import "ol/ol.css";
import "./index.css";
import registerServiceWorker from "./registerServiceWorker";

import React from "react";
import ReactDOM from "react-dom";
import App from "./components/App.js";
import buildConfig from "./buildConfig.json";

import { MuiThemeProvider, createMuiTheme } from "@material-ui/core/styles";
import deepmerge from "deepmerge";

import ErrorIcon from "@material-ui/icons/Error";

const networkErrorMessage =
  "Fel när applikationen skulle läsas in. Detta beror troligtvis på ett nätverksfel. Försök igen senare.";
const parseErrorMessage =
  "Fel när applikationen skulle läsas in. Detta beror troligtvis på ett konfigurationsfel. Försök igen senare.";

const fetchConfig = {
  credentials: "same-origin"
};

/* Helper function that creates a MUI theme by merging
 * hard-coded values (in this function), with custom values
 * (obtained from customTheme.json in /public).
 * This way, user can customize look and feel of application
 * AFTER it has been build with webpack, by simply tweaking
 * values in customTheme.json.
 * */
function getTheme(config, customTheme) {
  // Defaults is to lift colors from current map config and make them
  // primary and secondary colors for MUI theme.
  const hardCodedDefaults = {
    palette: {
      primary: {
        main: config.mapConfig.map.colors.primaryColor // primary: blue // <- Can be done like this (don't forget to import blue from "@material-ui/core/colors/blue"!)
      },
      secondary: {
        main: config.mapConfig.map.colors.secondaryColor // secondary: { main: "#11cb5f" } // <- Or like this
      }
    },
    typography: {
      useNextVariants: true
    },
    overrides: {
      MuiListItemIcon: {
        // Name of the component / style sheet
        root: {
          // Name of the rule
          // color: config.mapConfig.map.colors.primaryColor // Some CSS
        }
      }
    }
  };

  const mergedTheme = deepmerge(hardCodedDefaults, customTheme);
  return createMuiTheme(mergedTheme);
}

fetch("appConfig.json", fetchConfig)
  .then(appConfigResponse => {
    appConfigResponse.json().then(appConfig => {
      let defaultMap = appConfig.defaultMap;
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
      Promise.all([
        fetch(
          `${appConfig.proxy}${appConfig.mapserviceBase}/config/layers`,
          fetchConfig
        ),
        fetch(
          `${appConfig.proxy}${appConfig.mapserviceBase}/config/${defaultMap}`,
          fetchConfig
        ),
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
                var config = {
                  appConfig: appConfig,
                  layersConfig: layersConfig,
                  mapConfig: mapConfig,
                  activeMap: defaultMap
                };
                setTimeout(() => {
                  let theme = getTheme(config, customTheme);
                  ReactDOM.render(
                    <MuiThemeProvider theme={theme}>
                      <App
                        activeTools={buildConfig.activeTools}
                        config={config}
                      />
                    </MuiThemeProvider>,
                    document.getElementById("root")
                  );
                }, 500);

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
