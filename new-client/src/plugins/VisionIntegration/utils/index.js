// Some helper-functions for the Vision-integration-plugin

// Returns the layers (basically an array of objects containing all settings for a layer/source,
// not a "real" OL-layer) from the global-settings. (The global settings are found on the appModel
// and contains all layers that are used within the application, this functions returns the layers that
// are included in the searchSources array of the Vision-integration-plugin).
export const getSearchSources = (props) => {
  // Let's destruct some required properties. We're gonna need an object containing
  // both options (the plugin options) as well as the app (the appModel).
  const { options = {}, app = {} } = props;
  // Make sure the required properties were passed.
  if (!options.searchSources || !app.config?.layersConfig) {
    console.warn(
      `Could not generate search-sources. Missing required parameters.`
    );
    return [];
  }
  // If they were passed, we can get the id's of the search-sources that we want to get the config for.
  const searchSourceIds = options.searchSources.map((l) => l.id);
  // Then we can return an array containing all the configurations connected to layers (search-sources)
  // that are used in the plugin...
  return app.config.layersConfig.filter((l) => searchSourceIds.includes(l.id));
};
