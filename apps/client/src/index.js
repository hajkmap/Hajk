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
import StartupError from "./components/Errors/StartupError";
import HajkThemeProvider from "./components/HajkThemeProvider";
import { initHFetch, hfetch, initFetchWrapper } from "./utils/FetchWrapper";
import LocalStorageHelper from "./utils/LocalStorageHelper";
import { getMergedSearchAndHashParams } from "./utils/getMergedSearchAndHashParams";

/**
 * Entry point to Hajk.
 * We start with initializing HFetch (that provides some custom fetch options
 * to all requests throughout the application). Next, we fetch appConfig.json.
 *
 * appConfig.json includes URL to Hajk's backend application,
 * as well as the default preferred map configuration's file name.
 */
initHFetch();

// We must define appConfig outside of the try so it's available in catch
// statement. If we fail at some point, we may still be able to use the
// error message from appConfig (depending on if we manage to load it or not).
let appConfig;

try {
  const appConfigResponse = await hfetch("appConfig.json", {
    cacheBuster: true,
  });
  appConfig = await appConfigResponse.json();

  // Legacy code expects certain keys to be existent in appConfig.
  // They should in fact be optional. Let's ensure they exist on
  // the object further down the code, even if they don't exist
  // in the config file itself.
  appConfig.proxy = appConfig.proxy || "";
  appConfig.searchProxy = appConfig.searchProxy || "";

  // Update hfetch with loaded config.
  initFetchWrapper(appConfig);

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

  // Prepare a helper function that fetches config files
  const fetchConfig = async () => {
    if (useBackend === false) {
      // Load the user specified consolidated map and layers config, or fall back to default one
      const simpleConfig = `${initialURLParams.get("m") || "simpleMapAndLayersConfig"}.json`;
      return await hfetch(simpleConfig, {
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

  const [mapConfigResponse, customThemeResponse] = await Promise.all([
    fetchConfig(),
    hfetch("customTheme.json", { cacheBuster: true }),
  ]);

  const mapConfig = await mapConfigResponse.json();
  const customTheme = await customThemeResponse.json();

  const config = {
    activeMap: useBackend ? activeMap : "simpleMapConfig", // If we are not utilizing mapService, we know that the active map must be "simpleMapConfig".
    appConfig: appConfig,
    layersConfig: mapConfig.layersConfig,
    mapConfig: mapConfig.mapConfig,
    userDetails: mapConfig.userDetails,
    userSpecificMaps: mapConfig.userSpecificMaps,
    initialURLParams,
  };

  // For the sake of this example, I'm committing this basic object:
  // Expose a couple of useful properties as part of Hajk's public API. For
  // usage, see examples/embedded.html, which reads these values to control
  // which zoom levels are available in the embedded (outer) application.
  // This can be extended with more properties or even functions when the
  // need comes up.
  window.hajkPublicApi = {
    maxZoom: config.mapConfig.map.maxZoom,
    minZoom: config.mapConfig.map.minZoom,
  };

  // At this stage, we know for sure what activeMap is, so we can initiate the LocalStorageHelper
  LocalStorageHelper.setKeyName(config.activeMap);

  // Invoke React's renderer. Render the theme. Theme will render the App.
  createRoot(document.getElementById("root")).render(
    <HajkThemeProvider
      activeTools={buildConfig.activeTools}
      config={config}
      customTheme={customTheme}
    />
  );
} catch (error) {
  console.error(error);

  // Attempt to grab the custom error texts from appConfig, fall back to default.
  const loadErrorTitle = appConfig?.loadErrorTitle || "Ett fel har inträffat";
  const loadErrorMessage =
    appConfig?.loadErrorMessage ||
    "Fel när applikationen skulle läsas in. Du kan försöka att återställa applikationen genom att trycka på knappen nedan. Om felet kvarstår kan du kontakta systemansvarig.";
  const loadErrorReloadButtonText =
    appConfig?.loadErrorReloadButtonText || "Återställ applikationen";

  createRoot(document.getElementById("root")).render(
    <StartupError
      loadErrorMessage={loadErrorMessage}
      loadErrorTitle={loadErrorTitle}
      loadErrorReloadButtonText={loadErrorReloadButtonText}
    />
  );
}
