import "ol/ol.css";
import "./index.css";
import registerServiceWorker from "./registerServiceWorker";

import React from "react";
import ReactDOM from "react-dom";
import App from "./components/App.js";
import buildConfig from "./buildConfig.json";

import { MuiThemeProvider, createMuiTheme } from "@material-ui/core/styles";
import deepmerge from "deepmerge";

const networkErrorMessage =
  "Fel när applikationen skulle läsas in. Detta beror troligtvis på ett nätverksfel. Försök igen senare.";
const parseErrorMessage =
  "Fel när applikationen skulle läsas in. Detta beror troligtvis på ett konfigurationsfel. Försök igen senare.";

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
    overrides: {
      MuiListItemIcon: {
        // Name of the component / style sheet
        root: {
          // Name of the rule
          color: config.mapConfig.map.colors.primaryColor // Some CSS
        }
      }
    }
  };

  const mergedTheme = deepmerge(hardCodedDefaults, customTheme);
  return createMuiTheme(mergedTheme);
}

fetch("appConfig.json")
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
        fetch(`${appConfig.mapserviceBase}/config/layers`),
        fetch(`${appConfig.mapserviceBase}/config/${defaultMap}`),
        fetch("customTheme.json")
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
                  mapConfig: mapConfig
                };
                console.log("Got customTheme", customTheme);

                ReactDOM.render(
                  <MuiThemeProvider theme={getTheme(config, customTheme)}>
                    <App
                      activeTools={buildConfig.activeTools}
                      config={config}
                    />
                  </MuiThemeProvider>,
                  document.getElementById("root")
                );
                registerServiceWorker();
              })
              .catch(err => {
                console.error("Parse error: ", err);
                ReactDOM.render(
                  <div className="start-error">
                    <div>
                      <i className="material-icons">error</i>
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
                <i className="material-icons">error</i>
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
          <i className="material-icons">error</i>
        </div>
        <div>{networkErrorMessage}</div>
      </div>,
      document.getElementById("root")
    );
  });
