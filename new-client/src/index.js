// Removing this causes some of the older but still common devices (e.g. iOS 12, 13)
// to run into trouble.
import "react-app-polyfill/stable";

// iOS 12 and other older touch devices need this polyfill to
// support OpenLayers map interactions through Pointer Events API.
// See: https://github.com/hajkmap/Hajk/issues/606
import "elm-pep";
// In order to support iOS 12 we need this polyfill too:
import "core-js/features/promise/all-settled";

// Since we don't want to download roboto from the Google CDN,
// we use fontSource and import all subsets that MUI relies on here.
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

// The documentHandler imports icons in a dynamic way. To avoid requests against
// an outside CDN, we make sure to install the required font for the icons as well.
import "@fontsource/material-icons";

import "ol/ol.css";
import "./custom-ol.css";

import React from "react";
import { createRoot } from "react-dom/client";
import buildConfig from "./buildConfig.json";
import ErrorIcon from "@mui/icons-material/Error";
import HajkThemeProvider from "./components/HajkThemeProvider";
import { initHFetch, hfetch, initFetchWrapper } from "./utils/FetchWrapper";
import LocalStorageHelper from "./utils/LocalStorageHelper";
import { getMergedSearchAndHashParams } from "./utils/getMergedSearchAndHashParams";

initHFetch();

let networkErrorMessage =
  "Nätverksfel. Prova att ladda om applikationen genom att trycka på F5 på ditt tangentbord.";
let parseErrorMessage =
  "Fel när applikationen skulle läsas in. Detta beror troligtvis på ett konfigurationsfel. Försök igen senare.";

const domRoot = createRoot(document.getElementById("root"));

const renderError = (message, err) => {
  console.error(err);
  domRoot.render(
    <div className="start-error">
      <div>
        <ErrorIcon />
      </div>
      <div>{message}</div>
    </div>
  );
};

/**
 * Entry point to Hajk.
 * We start with a fetching appConfig.json, that is expected
 * to be located in the same directory as index.js.
 *
 * appConfig.json includes URL to the backend application (called MapService),
 * as well as the default preferred map configuration's file name.
 */
hfetch("appConfig.json", { cacheBuster: true })
  .then((appConfigResponse) => {
    appConfigResponse.json().then((appConfig) => {
      // Update hfetch with loaded config.
      initFetchWrapper(appConfig);
      // See if we have site-specific error messages
      if (appConfig.networkErrorMessage)
        networkErrorMessage = appConfig.networkErrorMessage;
      if (appConfig.parseErrorMessage)
        parseErrorMessage = appConfig.parseErrorMessage;

      // Grab URL params and save for later use
      const initialURLParams = getMergedSearchAndHashParams();

      // If m param is supplied, try loading a map with that name
      // or else, fall back to default from appConfig.json
      let activeMap = initialURLParams.has("m")
        ? initialURLParams.get("m")
        : appConfig.defaultMap;

      // Check if mapserviceBase is set in appConfig. If it is not, we will
      // fall back on the simple map and layer configurations found in /public.
      const useBackend = appConfig.mapserviceBase?.trim().length > 0;

      const fetchConfig = async () => {
        if (useBackend === false) {
          // No backend specified, let's return static config
          return await hfetch("simpleMapAndLayersConfig.json", {
            cacheBuster: true,
          });
        } else {
          // Prepare the URL config string
          const configUrl = `${appConfig.proxy}${appConfig.mapserviceBase}/config`;
          try {
            // Try to fetch user-specified config. Return it if OK.
            return await hfetch(`${configUrl}/${activeMap}`);
          } catch {
            // If the previous attempt fails reset "activeMap" to hard-coded value…
            activeMap = appConfig.defaultMap;
            // …and try to fetch again.
            return await hfetch(`${configUrl}/${activeMap}`);
          }
        }
      };

      Promise.all([
        fetchConfig(),
        hfetch("customTheme.json", { cacheBuster: true }),
      ])
        .then(([mapConfigResponse, customThemeResponse]) => {
          Promise.all([mapConfigResponse.json(), customThemeResponse.json()])
            .then(([mapConfig, customTheme]) => {
              const config = {
                activeMap: useBackend ? activeMap : "simpleMapConfig", // If we are not utilizing mapService, we know that the active map must be "simpleMapConfig".
                appConfig: appConfig,
                layersConfig: mapConfig.layersConfig,
                mapConfig: mapConfig.mapConfig,
                userDetails: mapConfig.userDetails,
                userSpecificMaps: mapConfig.userSpecificMaps,
                initialURLParams,
              };

              // TODO: Watchout - this can be a controversial introduction!
              // Before we merge, ensure that we really want this!
              // Why am I adding it? The examples/embedded.html shows Hajk running
              // in an IFRAME and allows it to be controlled by changing the SRC
              // attribute of the IFRAME. In that file, there are two buttons (one
              // to increase and another one to decrease the zoom level). However,
              // we don't want to zoom past map's zoom limits. At first I used some
              // hard-coded values for min/max zoom, but these will vary depending on
              // map config. So I figured out that we could expose some of Hajk's settings
              // on the global object. That way, the IFRAME's parent document can read
              // those values and use to check that we don't allow zooming past limits.
              //
              // We can of course add more things that can be "nice to have" for an
              // embedded solution. In addition to parameters, we could expose some API
              // that would control the map itself! But it should be carefully crafted.
              //
              // For the sake of this example, I'm committing this basic object:
              window.hajkPublicApi = {
                maxZoom: config.mapConfig.map.maxZoom,
                minZoom: config.mapConfig.map.minZoom,
              };

              // At this stage, we know for sure what activeMap is, so we can initiate the LocalStorageHelper
              LocalStorageHelper.setKeyName(config.activeMap);

              // Invoke React's renderer. Render Theme. Theme will render App.
              domRoot.render(
                <HajkThemeProvider
                  activeTools={buildConfig.activeTools}
                  config={config}
                  customTheme={customTheme}
                />
              );
            })
            .catch((err) => renderError(parseErrorMessage, err));
        })
        .catch((err) => renderError(networkErrorMessage, err));
    });
  })
  .catch((err) => {
    renderError(networkErrorMessage, err);
  });
