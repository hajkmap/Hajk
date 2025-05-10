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

  delete: function (folder, documentName, callback) {
    var url = "";
    if (folder) {
      url = this.get("config").url_delete + "/" + folder + "/" + documentName;
    } else {
      url = this.get("config").url_delete + "/" + documentName;
    }

    hfetch(url, {
      method: "delete",
    }).then((response) => {
      callback(response);
    });
  },

  save: function (folder, documentName, data, callback) {
    let url = this.get("config").url_save;

    if (folder) {
      url += "/" + folder;
    }
    url += "/" + documentName;

    data.chapters.forEach((chapter) => {
      this.deleteParentChapter(chapter, data.chapters);
    });

    data.chapters.forEach((chapter) => {
      chapter.html = chapter.html
        .replaceAll("&lt;", "<")
        .replaceAll("&gt;", ">");
    });

    const method = url.includes("/api/v2/") ? "put" : "post";

    hfetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Request failed with status: ${response.status}`);
        }
        return response.text();
      })
      .then(() => {
        callback("File saved");
      })
      .catch((error) => {
        callback(`Error: ${error.message}`);
      });
  },

  loadDocuments: async function (folder, callback) {
    const baseList = this.get("config").url_document_list;
    const baseLoad = this.get("config").url_load;
    const url = folder ? `${baseList}/${folder}` : baseList;

    try {
      const docNames = await (await hfetch(url)).json();

      // Filter out PDF files by checking Content-Type
      const filteredDocs = (
        await Promise.all(
          // Build URL for each file
          docNames.map(async (name) => {
            const docUrl = `${baseLoad}${folder ? "/" + folder : ""}/${name}`;
            // Make a HEAD request
            const head = await hfetch(docUrl, { method: "HEAD" });
            const type = head.headers.get("Content-Type") || "";
            // If it has JSON-like content, keep the file in the list
            return type.toLowerCase().includes("application/json")
              ? name
              : null;
          })
        )
      ).filter(Boolean);

      if (typeof callback === "function") {
        callback(filteredDocs); // Callback
        return;
      }

      return filteredDocs; // Promise
    } catch (err) {
      if (typeof callback === "function") {
        callback([]);
        return;
      }
      throw err;
    }
  },

  loadFolders: async function (callback) {
    const url = this.get("config").url_folder_list;

    try {
      const data = await (await hfetch(url)).json();

      // Callback
      if (typeof callback === "function") {
        callback(data);
        return;
      }

      // Promise
      return data;
    } catch (err) {
      if (typeof callback === "function") {
        callback([]);
        return;
      }
      throw err;
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

  createFolder(data, callback) {
    let url = this.get("config").url_create_folder;
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

  load: function (folder, documentName, callback) {
    let url = this.get("config").url_load;

    if (folder) {
      url += "/" + folder;
    }
    url += "/" + documentName;

    hfetch(url).then((response) => {
      if (response.status === 200) {
        response.json().then((data) => {
          data.chapters.forEach((chapter) => {
            this.setParentChapter(chapter, data.chapters);
          });
          callback(data);
        });
      }
    });
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
