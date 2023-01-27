import { Model } from "backbone";
import { hfetch } from "utils/FetchWrapper";

const $ = require("jquery");
const jQuery = $;
global.window.jQuery = jQuery;
require("jquery-sortable");

var documentEditor = Model.extend({
  setParentChapter: function setParentChapter(chapter, parent) {
    chapter.parent = parent;
    if (chapter.chapters.length > 0) {
      chapter.chapters.forEach((child) => {
        setParentChapter(child, chapter);
      });
    }
  },

  deleteParentChapter: function deleteParentChapter(chapter, parent) {
    delete chapter.parent;
    if (chapter.chapters.length > 0) {
      chapter.chapters.forEach((child) => {
        deleteParentChapter(child, chapter);
      });
    }
  },

  delete: function (documentName, callback) {
    var url = this.get("config").url_delete + "/" + documentName;
    hfetch(url, {
      method: "delete",
    }).then((response) => {
      callback(response);
    });
  },

  deleteDoc: function (folder, documentName, callback) {
    var url = "";
    if (folder) {
      url =
        this.get("config").url_deletedoc + "/" + folder + "/" + documentName;
    } else {
      url = this.get("config").url_deletedoc + "/" + documentName;
    }

    hfetch(url, {
      method: "delete",
    }).then((response) => {
      callback(response);
    });
  },

  save: function (documentName, data, callback) {
    var url = this.get("config").url_save + "/" + documentName;
    data.chapters.forEach((chapter) => {
      this.deleteParentChapter(chapter, data.chapters);
    });

    data.chapters.map((chapter) => {
      chapter.html = chapter.html
        .replaceAll("&lt;", "<")
        .replaceAll("&gt;", ">");
      return false;
    });

    hfetch(url, {
      method: "post",
      body: JSON.stringify(data),
    }).then((response) => {
      response.text().then((text) => {
        callback(text);
      });
    });
  },

  saveDoc: function (folder, documentName, data, callback) {
    var url = "";
    if (folder) {
      url = this.get("config").url_savedoc + "/" + folder + "/" + documentName;
      data.chapters.forEach((chapter) => {
        this.deleteParentChapter(chapter, data.chapters);
      });

      data.chapters.map((chapter) => {
        chapter.html = chapter.html
          .replaceAll("&lt;", "<")
          .replaceAll("&gt;", ">");
        return false;
      });
    } else {
      url = this.get("config").url_savedoc + "/" + documentName;
      data.chapters.forEach((chapter) => {
        this.deleteParentChapter(chapter, data.chapters);
      });

      data.chapters.map((chapter) => {
        chapter.html = chapter.html
          .replaceAll("&lt;", "<")
          .replaceAll("&gt;", ">");
        return false;
      });
    }

    hfetch(url, {
      method: "post",
      body: JSON.stringify(data),
    }).then((response) => {
      response.text().then((text) => {
        callback(text);
      });
    });
  },

  loadDocuments: async function (callback) {
    var url = this.get("config").url_document_list;
    try {
      const response = await hfetch(url);
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

  loadDocumentsFromFolder: async function (folder, callback) {
    var url = "";
    if (folder) {
      url = this.get("config").url_document_folder_list + "/" + folder;
    } else {
      url = this.get("config").url_document_folder_list;
    }
    try {
      const response = await hfetch(url);
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

  loadFolders: async function (callback) {
    var url = this.get("config").url_folder_list;
    try {
      const response = await hfetch(url);
      const text = await response.text();
      const data = JSON.parse(text);
      callback(data);
    } catch (err) {
      alert(
        "Kunde inte ladda mappen med mappar. Verifiera att uppsättningen är korrekt utförd."
      );
      console.error(err);
    }
  },

  createDocument(data, callback) {
    var url = this.get("config").url_create;
    hfetch(url, {
      method: "post",
      body: JSON.stringify(data),
    }).then((response) => {
      response.text().then((text) => {
        callback(text);
      });
    });
  },

  createDF(data, callback) {
    var url = this.get("config").url_createdoc;
    hfetch(url, {
      method: "post",
      body: JSON.stringify(data),
    }).then((response) => {
      response.text().then((text) => {
        callback(text);
      });
    });
  },

  createFolder(data, callback) {
    var url = this.get("config").url_create_folder;
    hfetch(url, {
      method: "post",
      body: JSON.stringify(data),
    }).then((response) => {
      response.text().then((text) => {
        callback(text);
        console.log(text);
      });
    });
  },

  load: function (documentName, callback) {
    var url = this.get("config").url_load + "/" + documentName;
    hfetch(url).then((response) => {
      response.status === 200 &&
        response.json().then((data) => {
          data.chapters.forEach((chapter) => {
            this.setParentChapter(chapter, data.chapters);
          });
          callback(data);
        });
    });
  },

  loadD: function (folder, documentName, callback) {
    var url = "";
    if (folder) {
      url =
        this.get("config").url_load_document +
        "/" +
        folder +
        "/" +
        documentName;
      hfetch(url).then((response) => {
        response.status === 200 &&
          response.json().then((data) => {
            data.chapters.forEach((chapter) => {
              this.setParentChapter(chapter, data.chapters);
            });
            callback(data);
          });
      });
    } else {
      url = this.get("config").url_load_document + "/" + documentName;
      hfetch(url).then((response) => {
        response.status === 200 &&
          response.json().then((data) => {
            data.chapters.forEach((chapter) => {
              this.setParentChapter(chapter, data.chapters);
            });
            callback(data);
          });
      });
    }
  },

  loadMaps: function (callback) {
    var url = this.get("config").url_map_list;
    hfetch(url).then((response) => {
      response.json().then((data) => {
        callback(data);
      });
    });
  },

  loadMapSettings: function (map, callback) {
    var url = this.get("config").url_map + "/" + map;
    hfetch(url).then((response) => {
      response.json().then((data) => {
        callback(data.map);
      });
    });
  },

  listImages: function (callback) {
    var url = this.get("config").list_images;
    hfetch(url).then((response) => {
      response.json().then((data) => {
        callback(data);
      });
    });
  },

  listVideos: function (callback) {
    var url = this.get("config").list_videos;
    hfetch(url).then((response) => {
      response.json().then((data) => {
        callback(data);
      });
    });
  },

  listAudios: function (callback) {
    var url = this.get("config").list_audios;
    hfetch(url).then((response) => {
      response.json().then((data) => {
        callback(data);
      });
    });
  },
});

export default documentEditor;
