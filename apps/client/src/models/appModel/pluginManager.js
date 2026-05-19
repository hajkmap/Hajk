import Plugin from "../Plugin";
import { isMobile } from "../../utils/IsMobile";

class PluginManager {
  constructor() {
    this.windows = [];
    this.plugins = {};
    this.pluginHistory = new Map();
  }

  registerWindowPlugin(windowComponent) {
    this.windows.push(windowComponent);
  }

  invokeCloseOnAllWindowPlugins() {
    this.windows.forEach((window) => {
      window.closeWindow();
    });
  }

  onWindowOpen(currentWindow) {
    this.windows
      .filter((window) => window !== currentWindow)
      .forEach((window) => {
        if (window.position === currentWindow.position || isMobile) {
          window.closeWindow();
        }
      });
  }

  pushPluginIntoHistory(plugin, globalObserver) {
    // plugin is an object that will contain a 'type' as well as some
    // other properties. We use the 'type' as a unique key in our Map.
    const { type, ...rest } = plugin;
    // If plugin already exists in set…
    if (this.pluginHistory.has(type)) {
      // …remove it first so that we don't have duplicates.
      this.pluginHistory.delete(type);
    }
    this.pluginHistory.set(type, rest);

    // Finally, announce to everyone who cares
    globalObserver.publish("core.pluginHistoryChanged", this.pluginHistory);
  }

  /**
   * Add plugin to this tools property of loaded plugins.
   * @internal
   */
  addPlugin(plugin) {
    this.plugins[plugin.type] = plugin;
  }

  /**
   * Get loaded plugins
   * @returns Array<Plugin>
   */
  getPlugins() {
    return Object.keys(this.plugins).reduce((v, key) => {
      return [...v, this.plugins[key]];
    }, []);
  }

  /**
   * @summary Helper used by getBothDrawerAndWidgetPlugins(), checks
   * that the supplied parameter has one of the valid "target" values.
   *
   * @param {string} t Target to be tested
   * @returns {boolean}
   */
  #validPluginTarget = (t) => {
    // FIXME: Why is "hidden" included in this list, anyone?
    return ["toolbar", "left", "right", "control", "hidden"].includes(t);
  };

  /**
   * A plugin may have the 'target' option. Currently we use four
   * targets: toolbar, control, left and right. Toolbar means it's a
   * plugin that will be visible in Drawer list. Left and right
   * are Widget plugins, that on large displays show on left/right
   * side of the map viewport, while on small screens change its
   * appearance and end up as Drawer list plugins too. Control buttons
   * are displayed in the same area as map controls, e.g. zoom buttons.
   *
   * This method filters out those plugins that should go into
   * the Drawer, Widget or Control list and returns them.
   *
   * It is used in AppModel to initiate all plugins' Components,
   * so whatever is returned here will result in a render() for
   * that plugin.
   *
   * @returns array of Plugins
   */
  getBothDrawerAndWidgetPlugins() {
    const r = this.getPlugins()
      .filter((plugin) => {
        return (
          // If "options" is an Array (of plugin entities) we must
          // look for the "target" property inside that array. As soon
          // as one of the entities has a valid "target" value, we
          // consider the entire plugin to be valid and included in this list.
          // If "options" isn't an array, we can grab the "target" directly.
          plugin.options.some?.((p) => this.#validPluginTarget(p.target)) ||
          this.#validPluginTarget(plugin.options.target)
        );
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);
    return r;
  }

  getDrawerPlugins() {
    return this.getPlugins().filter((plugin) => {
      return ["toolbar"].includes(plugin.options.target);
    });
  }

  /**
   * @summary Return all plugins that might render in Drawer.
   *
   * @description There reason this functions exists is that we must
   * have a way to determine whether the Drawer toggle button should be
   * rendered. It's not as easy as checking for Drawer plugins only (i.e.
   * those with target=toolbar) - this simple logic gets complicated by
   * the fact that Widget plugins (target=left|right) and Control buttons (target=control)
   * also render Drawer buttons on small screens.
   */
  getPluginsThatMightRenderInDrawer() {
    return this.getPlugins().filter((plugin) => {
      return ["toolbar", "left", "right", "control"].includes(
        plugin.options.target
      );
    });
  }

  /**
   * Dynamically load plugins from the configured plugins folder.
   * Assumed that a folder exists with the same name as the requested plugin.
   * There must also be a file present with the same name as well.
   * We look for both .jsx and .tsx files.
   * @param {object} appModel - The AppModel instance (needed for config, map, addPlugin)
   * @param {Array} plugins - List of plugins to be loaded.
   * @returns {Array} - List of promises to be resolved.
   */
  loadPlugins(appModel, plugins) {
    const promises = [];

    // NOTE: glob paths below are relative to appModel/pluginManager.js, NOT AppModel.js.
    // Each path has one extra "../" compared to the original AppModel.js version.
    // First let's check what files exist in the expected paths
    const availableFiles = import.meta.glob([
      "../../components/Search/*.{js,jsx,ts,tsx}", // special case as it's not inside plugins/
      "../../plugins/*/*.{js,jsx,ts,tsx}",
    ]);

    // Now loop the plugins array and…
    plugins.forEach((plugin) => {
      // (Again, for our special case)
      const dir = ["Search"].includes(plugin) ? "components" : "plugins";

      // …determine the expected path (but we don't know the file extension yet!).
      // Path prefix is relative to appModel/pluginManager.js — two levels up to reach src/
      const basePath = `../../${dir}/${plugin}/${plugin}`;

      // Our module loader _should_ be on the expected path + one of the possible
      // file extensions.
      const loader =
        availableFiles[`${basePath}.tsx`] || availableFiles[`${basePath}.jsx`];

      // We have to make sure that the loader is an actual function
      if (typeof loader !== "function") {
        console.error(
          `AppModel.loadPlugins: Could not find module for plugin "${plugin}".`
        );
        return;
      }

      const prom = loader()
        .then((module) => {
          const toolConfig =
            appModel.config.mapConfig.tools.find(
              (plug) => plug.type.toLowerCase() === plugin.toLowerCase()
            ) || {};

          const toolOptions =
            toolConfig && toolConfig.options ? toolConfig.options : {};

          const sortOrder = toolConfig.hasOwnProperty("index")
            ? Number(toolConfig.index)
            : 0;

          if (Object.keys(toolConfig).length > 0) {
            this.addPlugin(
              new Plugin({
                map: appModel.map,
                app: appModel,
                type: plugin.toLowerCase(),
                searchInterface: {},
                sortOrder: sortOrder,
                options: toolOptions,
                component: module.default,
              })
            );
          }
        })
        .catch((err) => {
          console.error(err);
        });
      promises.push(prom);
    });
    return promises;
  }
}

export default PluginManager;
