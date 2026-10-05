## The Dummy-plugin

To make it easier for developers to create new plugins in Hajk we've decided to provide a Dummy-plugin. The Dummy-plugin contains information and examples regarding plugin development. If you find that something that is regularly used is missing, feel free to add it!

### Creating a new plugin

When creating a new plugin, there are some crucial steps to get going:

- Make a copy of the plugin-template (The plugin template is still TODO, so copy the Dummy for now)
- Set proper names on files and components
- **Name the plugin folder and its entry file the same: `src/plugins/<Name>/<Name>.jsx` or `.tsx`. That file is treated as an available plugin automatically.** Also add it to `availableTools` in `appConfig.json` when that list is set.
- Make sure to add some kind of basic configuration for your plugin to the tool in the your map configuration file.
