// Copyright (C) 2016 Göteborgs Stad
//
// Denna programvara är fri mjukvara: den är tillåten att distribuera och modifiera
// under villkoren för licensen CC-BY-NC-SA 4.0.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the CC-BY-NC-SA 4.0 licence.
//
// http://creativecommons.org/licenses/by-nc-sa/4.0/
//
// Det är fritt att dela och anpassa programvaran för valfritt syfte
// med förbehåll att följande villkor följs:
// * Copyright till upphovsmannen inte modifieras.
// * Programvaran används i icke-kommersiellt syfte.
// * Licenstypen inte modifieras.
//
// Den här programvaran är öppen i syfte att den skall vara till nytta för andra
// men UTAN NÅGRA GARANTIER; även utan underförstådd garanti för
// SÄLJBARHET eller LÄMPLIGHET FÖR ETT VISST SYFTE.
//
// https://github.com/Johkar/Hajk2

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

    var type = (panel.get('panel') || '').toLowerCase()
    ,   panelRef = _.find(this.get("panels"), panel => (panel.type || '').toLowerCase() === type)
    ,   activePanel = this.get("activePanel");

    if (visible) {
      if (activePanel) {
        let a = activePanel.model.get('panel')
        ,   b = panel.get('panel').toLowerCase();

        activePanel.model.set("visible", false);

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
