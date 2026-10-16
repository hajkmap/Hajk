/**
 * @summary Open and close plugin windows by name.
 *
 * @description Window plugins (`BaseWindowPlugin`) and dialog plugins
 * (`DialogWindowPlugin`) subscribe to `{name}.showWindow` and
 * `{name}.closeWindow` on the app observer. This model publishes those
 * events so the console, embedders, and other plugins can open a tool
 * without clicking its button.
 *
 * The name is the plugin `type`, lowercased. InfoDialog instances that
 * set `options.name` use `infodialog.<name>`.
 *
 *   const pc = window.hajkPublicApi.pluginControl;
 *   pc.show("anchor");
 *   pc.hide("anchor");
 *   pc.show("infodialog.help");
 */
class PluginControlModel {
  #globalObserver;

  constructor({ globalObserver }) {
    this.#globalObserver = globalObserver;
  }

  #normalizeName(name) {
    if (typeof name !== "string" || name.trim() === "") {
      console.warn("pluginControl: a plugin name is required.");
      return null;
    }
    return name.trim().toLowerCase();
  }

  /**
   * Open a plugin window. Same event as the command palette and the `p`
   * URL parameter: other windows in the same position close, and the
   * plugin's `onWindowShow` callback runs.
   * @param {string} name Plugin type, e.g. `"anchor"` or `"infodialog.help"`.
   */
  show(name) {
    const pluginName = this.#normalizeName(name);
    if (!pluginName) {
      return;
    }
    this.#globalObserver.publish(`${pluginName}.showWindow`);
  }

  /**
   * Close a plugin window.
   * @param {string} name Plugin type, e.g. `"anchor"` or `"infodialog.help"`.
   */
  hide(name) {
    const pluginName = this.#normalizeName(name);
    if (!pluginName) {
      return;
    }
    this.#globalObserver.publish(`${pluginName}.closeWindow`);
  }
}

export default PluginControlModel;
