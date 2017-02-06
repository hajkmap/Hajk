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

var ToolModel = require('tools/tool');

/**
 * @typedef {Object} SaveStateModel~SaveStateModelProperties
 * @property {string} type - Default: export
 * @property {string} panel - Default: exportpanel
 * @property {string} title - Default: Skriv ut
 * @property {string} toolbar - Default: bottom
 * @property {string} icon - Default: fa fa-bookmark icon
 * @property {string} title - Default: Kartlager
 * @property {Shell} shell
 * @property {string} settingsUrl
 * @property {object[]} bookmarks
 */
var BookmarkProperties = {
  type: 'bookmark',
  panel: 'bookmarkpanel',
  toolbar: 'bottom',
  icon: 'fa fa-bookmark icon',
  title: 'Bokmärken',
  visible: false,
  shell: undefined,
  settingsUrl: "",
  bookmarks: []
};

/**
 * Prototype for creating a layerswitcher model.
 * @class
 * @augments {external:"Backbone.Model"}
 * @param {SaveStateModel~SaveStateModelProperties} options - Default options
 */
var BookmarkModel = {
  /**
   * @instance
   * @property {SaveStateModel~SaveStateModelProperties} defaults - Default settings
   */
  defaults: BookmarkProperties,

  initialize: function (options) {
    ToolModel.prototype.initialize.call(this);
  },

  configure: function (shell) {

    var url = this.get('settingsUrl')
    ,   bookmarks;

    this.set('shell', shell);

    if (!shell.getBookmarks()) {
      bookmarks = localStorage.getItem('bookmarks');
      if (bookmarks) {
        try {
          bookmarks = JSON.parse(bookmarks);
        } catch (e) {
          bookmarks = [];
          console.log("Set item");
          localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
        }
      } else {
        bookmarks = [];
        localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
      }
      shell.setBookmarks(bookmarks);
    }
  },

  /**
   * Reload the application with given bookmark.
   * @instance
   * @param {object} bookmark - Bookmark with settings to be loaded.
   */
  updateApplication: function (bookmark) {
    var json = atob(bookmark.settings);
    var settings = JSON.parse(json);
    this.get('shell').setConfig(settings);
  },

  /**
   * Add and save a new bookmark.
   * @instance
   * @param {string} name - Name of the bookmark.
   * @param {function} callback - Fn to be called when the save is complete.
   */
  addBookmark: function (name, callback) {
    var numBookmarks = this.getBookmarks() &&
        this.getBookmarks().length ?
        this.getBookmarks().length : 0;
    var model = this.get('shell').toJSON();
    var b64 = btoa(model);
    var data = {
      name: name,
      settings: b64,
      favourite: numBookmarks === 0 ? true : false
    };

    if (!localStorage.getItem('bookmarks')) {
      localStorage.setItem('bookmarks', JSON.stringify([]));
    }

    var bookmarks = localStorage.getItem('bookmarks');

    try {
      bookmarks = JSON.parse(bookmarks);
      if (!Array.isArray(bookmarks)) {
        bookmarks = [];
      }
    } catch (e) {
      bookmarks = [];
    }

    bookmarks.push(data);
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
    this.get('shell').setBookmarks(bookmarks);
    callback();
  },

  /**
  * Update an existing bookmark.
  * @instance
  * @param {object} bookmark - Bookmark to be updated.
  * @param {function} callback - Fn to be called when the update is complete.
  */
  updateBookmark: function(bookmark, callback) {
    //
    //TODO:
    // Hämta från local storage och uppdatera istället.
    //
    // $.ajax({
    //   url: this.get('settingsUrl'),
    //   type: 'put',
    //   contentType: 'application/json',
    //   data: JSON.stringify(bookmark),
    //   dataType: 'json',
    //   success:(bookmarks) => {
    //     this.get('shell').setBookmarks(bookmarks);
    //     callback();
    //   }
    // });
  },

  /**
   * Update an existing bookmark.
   * @instance
   * @param {number} id - ID of bookmark to be removed.
   * @param {function} callback - Fn to be called when the removal is complete.
   */
  removeBookmark: function(id, callback) {
    //
    // TODO:
    // Hämta från local storage och uppdatera istället.
    //
    // $.ajax({
    //   url: this.get('settingsUrl') + id,
    //   type: 'delete',
    //   contentType: 'application/json',
    //   dataType: 'json',
    //   success:(bookmarks) => {
    //     this.get('shell').setBookmarks(bookmarks);
    //     callback();
    //   }
    // });
  },

  /**
   * Get bookmarks from shell.
   * @instance
   * @return {object[]} bookmarks
   */
  getBookmarks: function () {
    return this.get('shell').getBookmarks();
  },

  /**
   * @description
   *
   *   Handle click event on toolbar button.
   *   This handler sets the property visible,
   *   wich in turn will trigger the change event of navigation model.
   *   In pracice this will activate corresponding panel as
   *   "active panel" in the navigation panel.
   *
   * @instance
   */
  clicked: function () {
    this.set('visible', true);
  }
};

/**
 * Bookmark model module.<br>
 * Use <code>require('models/bookmark')</code> for instantiation.
 * @module BookmarkModel-module
 * @returns {BookmarkModel}
 */
module.exports = ToolModel.extend(BookmarkModel);
