## The Dummy-plugin

To make it easier for developers to create new plugins in Hajk we've decided to provide a Dummy-plugin. The Dummy-plugin contains information and examples regarding plugin development. If you find that something that is regularly used is missing, feel free to add it!

### Creating a new plugin

When creating a new plugin, there are some crucial steps to get going:

- Make a copy of the plugin-template (The plugin template is still TODO, so copy the Dummy for now)
- Set proper names on files and components
- **Make sure to add the new plugin to `AVAILABLE_TOOLS` (in `apps/client/src/constants.js`) as well as to `availableTools` in `appConfig.json`.**
- Make sure to add some kind of basic configuration for your plugin to the tool in the your map configuration file.
