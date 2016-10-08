/**
 * @typedef {Object} NavigationModel~NavigationModelProperties
 * @property {Array<{object}>} panels
 * @property {boolean} visible
 * @property {booelan} toggled
 * @property {string} activePanel
 */
var NavigationModelProperties =  {
  panels: [],
  visible: false,
  toggled: false,
  activePanel: undefined
};

/**
 * @desription
 *
 *  Prototype for creating a navigation model.
 *
 * @class
 * @augments {external:"Backbone.Model"}
 * @param {NavigationModel~NavigationModelProperties} options - Default options
 */
var NavigationModel = {
  /**
   * @instance
   * @property {NavigationModel~NavigationModelProperties} defaults - Default settings
   */
  defaults: NavigationModelProperties,

  initialize: function (options) {

    options.panels.forEach(panel => {
      panel.model.on("change:visible", this.onPanelVisibleChanged, this);
    });

    this.on('change:visible', (s, visible) => {
      if (this.get('activePanel') && !visible) {
        this.get('activePanel').model.set('visible', visible);
      }
    });
  },

  /**
   * Change active panel
   * @instance
   * @property {object} panelRef
   * @property {string} type
   */
  navigate: function(panelRef, type) {
    if (panelRef) {
      this.set("activePanelType", type);
      this.set("activePanel", panelRef);
      if (!this.get("visible")) {
        this.set("visible", true);
      }
    } else {
      this.set("visible", false);
    }
  },

  /**
   * Handler for toggle events of panels.
   * @instance
   * @param {object} panel
   * @param {boolean} visible
   */
  onPanelVisibleChanged: function (panel, visible) {
    var type = (panel.get('panel') || '').toLowerCase();
    var panelRef = _.find(this.get("panels"), panel => (panel.type || '').toLowerCase() === type);
    var activePanel = this.get("activePanel");

    if (visible) {

      if (activePanel) {
        activePanel.model.set("visible", false);

        var a = activePanel.model.get('panel');
        var b = panel.get('panel').toLowerCase();

        if (activePanel.model.filty && a !== b) {

          this.set('alert', true);

          this.ok = () => {
            this.navigate(panelRef, type);
          };

          this.deny = () => {
            if (panelRef) {
              panelRef.model.set('visible', false);
            }
          }

        }
      }

      if (!this.get('alert')) {
        this.navigate(panelRef, type);
      }

    }
  }

};

/**
 * Navigation model module.<br>
 * Use <code>require('models/navigation')</code> for instantiation.
 * @module NavigationModel-module
 * @returns {NavigationModel}
 */
module.exports = Backbone.Model.extend(NavigationModel);
