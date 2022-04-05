import { Model } from "backbone";

const $ = require("jquery");
const jQuery = $;
global.window.jQuery = jQuery;
require("jquery-sortable");

var documentEditor = Model.extend({
  setParentChapter: function setParentChapter(chapter, parent) {
    chapter.parent = parent;
    if (chapter.chapters.length > 0) {
      chapter.chapters.forEach(child => {
        setParentChapter(child, chapter);
      });
    }
  },

  deleteParentChapter: function deleteParentChapter(chapter, parent) {
    delete chapter.parent;
    if (chapter.chapters.length > 0) {
      chapter.chapters.forEach(child => {
        deleteParentChapter(child, chapter);
      });
    }
  },

  delete: function(documentName, callback) {
    var url = this.get("config").url_delete + "/" + documentName;
    fetch(url, {
      credentials: "same-origin",
      method: "delete"
    }).then(response => {
      callback(response);
    });
  },

  save: function(documentName, data, callback) {
    var url = this.get("config").url_save + "/" + documentName;
    data.chapters.forEach(chapter => {
      this.deleteParentChapter(chapter, data.chapters);
    });
    fetch(url, {
      credentials: "same-origin",
      method: "post",
      body: JSON.stringify(data)
    }).then(response => {
      response.text().then(text => {
        callback(text);
      });
    });
  },

  loadDocuments: async function(callback) {
    var url = this.get("config").url_document_list;
    try {
      const response = await fetch(url, { credentials: "same-origin" });
      const text = await response.text();
      const data = JSON.parse(text);
      callback(data);
    } catch (err) {
      alert(
        "Kunde inte ladda mappen med dokument. Verifiera att uppsättningen är korrekt utförd."
      );
      console.error(err);
    }
  },

  createDocument(data, callback) {
    var url = this.get("config").url_create;
    fetch(url, {
      method: "post",
      body: JSON.stringify(data),
      credentials: "same-origin"
    }).then(response => {
      response.text().then(text => {
        callback(text);
      });
    });
  },

  load: function(documentName, callback) {
    var url = this.get("config").url_load + "/" + documentName;
    fetch(url, { credentials: "same-origin" }).then(response => {
      response.json().then(data => {
        data.chapters.forEach(chapter => {
          this.setParentChapter(chapter, data.chapters);
        });
        callback(data);
      });
    });
  },

  loadMaps: function(callback) {
    var url = this.get("config").url_map_list;
    fetch(url, { credentials: "same-origin" }).then(response => {
      response.json().then(data => {
        callback(data);
      });
    });
  },

  loadMapSettings: function(map, callback) {
    var url = this.get("config").url_map + "/" + map;
    fetch(url, { credentials: "same-origin" }).then(response => {
      response.json().then(data => {
        callback(data.map);
      });
    });
  },

  listImages: function(callback) {
    var url = this.get("config").list_images;
    fetch(url, { credentials: "same-origin" }).then(response => {
      response.json().then(data => {
        callback(data);
      });
    });
  }
});

export default documentEditor;
