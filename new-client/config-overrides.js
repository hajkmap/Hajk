const webpack = require("webpack");
const fs = require("fs");
const path = require("path");

const getIgnoredPlugins = () => {
  const ignoredPlugins = [];
  const buildConfig = JSON.parse(
    fs.readFileSync(path.join("src", "buildConfig.json"), "utf8")
  );
  const { allTools, activeTools } = buildConfig;
  for (const tool of allTools) {
    if (!activeTools.includes(tool)) {
      //ignoredPlugins.push(path.join("plugins", tool)); // Maybe?
      ignoredPlugins.push(tool);
    }
  }
  console.log(ignoredPlugins);
  return ignoredPlugins;
};

const ignoredPlugins = getIgnoredPlugins();

module.exports = function override(config) {
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
