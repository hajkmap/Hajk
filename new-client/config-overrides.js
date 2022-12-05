const webpack = require("webpack");
const fs = require("fs");
const path = require("path");

// Returns an array of strings representing all the Hajk-plugins that
// have been removed from "activeTools" in the build-config (i.e. they should
// _not_ be included in the bundle)!
const getIgnoredPlugins = () => {
  // Let's initiate an array holding the plugins that should be ignored
  const ignoredPlugins = [];
  // Get the build-config
  const buildConfig = JSON.parse(
    fs.readFileSync(path.join("src", "buildConfig.json"), "utf8")
  );
  // Destruct the "allTools" and "activeTools" properties from the configuration
  const { allTools, activeTools } = buildConfig;
  // For each tool (plugin) in "allTools", check if is included in "activeTools". If it is
  // not included, it should be added to the array of ignored plugins so that we can
  // remove it from the bundle.
  for (const plugin of allTools) {
    if (!activeTools.includes(plugin)) {
      ignoredPlugins.push(`plugins/${plugin}/`);
    }
  }
  // Then we return the array of plugins to ignore!
  return ignoredPlugins;
};

// Let's get all the plugins that should be removed from the bundle.
const ignoredPlugins = getIgnoredPlugins();

// Webpack overrides...
module.exports = function override(config) {
  //The application consists of a bunch of plugins that can be enabled
  // or disabled. If they are disabled (not included in the "activeTools"-prop in the build-config)
  // they shouldn't be included in the bundle! Let's add a Webpack-Ignore-Plugin making sure to
  // remove (ignore) those plugins. This will reduce the bundle-since significantly if unused plugins
  // are removed from the "activeTools"-prop.
  config.ignoreWarnings = [/Failed to parse source map/];
  config.plugins.push(
    new webpack.IgnorePlugin({
      checkResource(resource) {
        if (ignoredPlugins.some((plugin) => resource.includes(plugin))) {
          return true;
        }
      },
    })
  );

  return config;
};
