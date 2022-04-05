// IE 11 starts here.
// If you don't need IE 11, comment out those lines line.
// Also, change 'browserslist' in package.json to exclude ie11.
import "react-app-polyfill/ie11";
import "react-app-polyfill/stable";
import "abortcontroller-polyfill/dist/polyfill-patch-fetch";
import "allsettled-polyfill";
// IE 11 ends here.

// iOS 12 and other older touch devices need this polyfill to
// support OpenLayers map interactions through Pointer Events API.
// See: https://github.com/hajkmap/Hajk/issues/606
import "elm-pep";

import "ol/ol.css";
import "./custom-ol.css";

import * as serviceWorker from "./serviceWorker";

import React from "react";
import ReactDOM from "react-dom";
import buildConfig from "./buildConfig.json";
import ErrorIcon from "@material-ui/icons/Error";
import HajkThemeProvider from "./components/HajkThemeProvider";

const networkErrorMessage =
  "Nätverksfel. Prova att ladda om applikationen genom att trycka på F5 på ditt tangentbord.";
const parseErrorMessage =
  "Fel när applikationen skulle läsas in. Detta beror troligtvis på ett konfigurationsfel. Försök igen senare.";

const fetchOpts = {
  credentials: "same-origin",
};

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

                // Invoke React's renderer. Render Theme. Theme will render App.
                ReactDOM.render(
                  <HajkThemeProvider
                    activeTools={buildConfig.activeTools}
                    config={config}
                    customTheme={customTheme}
                  />,
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
