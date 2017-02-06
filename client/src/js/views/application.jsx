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

var Shell = require('views/shell');
var ShellModel = require('models/shell');

/**
 * Application view
 * @class
 * @augments {external:"Backbone.View"}
 */
var ApplicationView = {
  /**
   * @property {string} el - DOM element to render this app into.
   * @instance
   */
  el: "map",
  /**
   * Load the application.
   * @instance
   * @param {object} config
   */
  load: function (config, bookmarks) {
    this.shell = new ShellModel(config);
    this.shell.setBookmarks(bookmarks);
    this.shell.on('change:configUpdated', () => {
      this.shell.updateConfig();
      this.shell.setBookmarks(bookmarks);
    });
  },

  initialize: function (config, bookmarks) {
    this.load(config, bookmarks);
  },
  /**
   * Render the view
   * @instance
   * @param {boolean} force - Force update
   */
  render: function (force) {

    var el = document.getElementById(this.$el.selector);
    var errorStyle = { 'margin-top': '50px', 'text-align': 'center' };

    if (!el) {
      return alert("Applikationen har stannat. Försök igen senare.");
    }

    if (force) {
      ReactDOM.unmountComponentAtNode(el);
    }

    if (this.shell.get('canStart')) {
      ReactDOM.render(<Shell model={this.shell} />, el);
    } else {
      ReactDOM.render(
        <div className="container">
          <div className="alert alert-danger" style={errorStyle}>
            <h2>Kartan kunde inte startas upp.</h2>
            <p>Var god kontakta systemadminstratören.</p>
          </div>
        </div>,
        el
      );
    }
  }
};

/**
 * ApplicationView module.<br>
 * Use <code>require('views/application')</code> for instantiation.
 * @module ApplicationView-module
 * @returns {ApplicationView}
 */
module.exports = Backbone.View.extend(ApplicationView);
