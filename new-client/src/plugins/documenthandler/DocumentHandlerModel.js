import React from "react";

import DocumentSearchModel from "./documentSearch/DocumentSearchModel";

/**
 * @summary  DocumentHandler model that doesn't do much.
 * @description This model exposes only one method, getMap(),
 * so it does not do anything crucial. But you can see it
 * as an example of how a plugin can be separated in different
 * components.
 *
 * @class DocumentHandlerModel
 */

const fetchConfig = {
  credentials: "same-origin",
};

export default class DocumentHandlerModel {
  internalId = 0;

  constructor(settings) {
    this.mapServiceUrl =
      settings.app.config.appConfig.proxy +
      settings.app.config.appConfig.mapserviceBase;
    this.settings = settings;
    this.allDocuments = [];
    this.chaptersMatchSearch = [];
    this.chapterInfo = [];
    this.chapterNumber = 0;
  }

  init = () => {
    return this.getAllDocumentsContainedInMenu()
      .then((allDocuments) => {
        this.allDocuments = allDocuments;
        this.documentSearchmodel = new DocumentSearchModel({
          allDocuments: allDocuments,
        });
        this.settings.resolveSearchInterface(
          this.documentSearchmodel.implementSearchInterface()
        );
      })
      .then(() => {
        return this;
      });
  };

  getDocumentsFromMenus(menu) {
    return menu.filter((menuItem) => {
      return menuItem.document || menuItem.menu.length > 0;
    });
  }

  getFlattenedMenu(menu) {
    let flattenedMenu = [];
    menu.forEach((menuItem) => {
      if (menuItem.menu.length > 0) {
        flattenedMenu = flattenedMenu.concat(
          this.getFlattenedMenu(menuItem.menu)
        );
      } else {
        flattenedMenu.push(menuItem);
      }
    });
    return flattenedMenu;
  }

  getAllDocumentsContainedInMenu() {
    return new Promise((resolve, reject) => {
      if (this.allDocuments.length > 0) {
        resolve(this.allDocuments);
      }
      Promise.all(
        this.getFlattenedMenu(
          this.getDocumentsFromMenus(this.settings.menu)
        ).map((menuItem) => {
          return this.fetchJsonDocument(menuItem.document).then((doc) => {
            doc.documentColor = menuItem.color;
            doc.documentFileName = menuItem.document;
            doc.documentTitle = menuItem.title;
            return doc;
          });
        })
      )
        .then((documents) => {
          resolve(documents);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  getDocuments(fileNames) {
    let documents = [];
    fileNames.forEach((fileName) => {
      let document = this.allDocuments.find(
        (document) => document.documentFileName === fileName
      );
      documents = [...documents, document];
    });

    return documents;
  }

  getAllChapterInfo() {
    if (this.chapterInfo.length === 0) {
      this.allDocuments.forEach((document, index) => {
        this.setChapterInfo(document.chapters[0], 0, document.documentColor);
      });
      this.mergeChapterInfo();
    }
    return this.chapterInfo;
  }

  getParentIdentifier(chapter) {
    if (chapter.parent) {
      if (chapter.parent.headerIdentifier) {
        return chapter.parent.headerIdentifier;
      }
      return this.getParentIdentifier(chapter.parent);
    }
  }

  setChapterInfo(chapter, level, color) {
    let getParentIdentifier = this.getParentIdentifier(chapter);
    let chapterInfo = {};
    chapterInfo.id = ++this.chapterNumber;
    chapterInfo.level = level;
    chapterInfo.html = chapter.html;
    chapterInfo.parent = chapter.parent;
    chapterInfo.color = color;
    chapterInfo.header = chapter.header;
    chapterInfo.headerIdentifier = chapter.headerIdentifier;
    chapterInfo.chosenForPrint = false;
    chapterInfo.parent = getParentIdentifier;

    if (chapter.chapters && chapter.chapters.length > 0) {
      chapterInfo.hasSubChapters = true;
      this.chapterInfo = [...this.chapterInfo, chapterInfo];
      level = level + 1;
      chapter.chapters.forEach((subChapter) => {
        subChapter = this.setChapterInfo(subChapter, level, color);
      });
    } else {
      chapterInfo.hasSubChapters = false;
      this.chapterInfo = [...this.chapterInfo, chapterInfo];
    }
  }

  mergeChapterInfo() {
    this.chapterInfo.forEach((item) => {
      if (item.hasSubChapters && item.headerIdentifier) {
        item.chapters = this.chapterInfo.filter(
          (chapterItem) => chapterItem.parent === item.headerIdentifier
        );
        this.chapterInfo = this.chapterInfo.filter(
          (chapterItem) => chapterItem.parent !== item.headerIdentifier
        );
      }
    });
  }

  getChapterById(chapters, id) {
    for (let i = 0; i < chapters.length; i++) {
      if (chapters[i].id === id) {
        return chapters[i];
      } else if (chapters[i].chapters && chapters[i].chapters.length > 0) {
        let foundSubChapter = this.getChapterById(chapters[i].chapters, id);
        if (foundSubChapter) {
          return foundSubChapter;
        }
      }
    }
  }

  async fetchJsonDocument(title) {
    let response;
    try {
      response = await fetch(
        `${this.mapServiceUrl}/informative/load/${title}`,
        fetchConfig
      );
      const text = await response.text();
      if (text === "File not found") {
        throw new Error("File not found");
      }
      const document = await JSON.parse(text);
      this.internalId = 0;
      document.chapters.forEach((chapter) => {
        this.setParentChapter(chapter, undefined);
        this.setInternalId(chapter);
        this.setScrollReferences(chapter);
        this.internalId = this.internalId + 1;
      });

      return document;
    } catch (err) {
      throw new Error(err);
    }
  }

  findChapter(chapter, headerIdentifierToFind) {
    if (chapter.headerIdentifier === headerIdentifierToFind) {
      return chapter;
    }
    if (chapter.chapters.length > 0) {
      return chapter.chapters.find((child) => {
        return this.findChapter(child, headerIdentifierToFind);
      });
    }
  }
  /**
   * @summary method to find a certain chapter in a fetched document with a unique headerGUID.
   * it is used when user clicks a text-link to a certain document and header in the text in the document-window
   *
   * @memberof DocumentHandlerModel
   */
  getHeaderRef = (activeDocument, headerIdentifierToFind) => {
    let foundChapter;
    activeDocument.chapters.some((chapter) => {
      foundChapter = this.findChapter(chapter, headerIdentifierToFind);
      return foundChapter;
    });
    return foundChapter;
  };

  /**
   * @summary Dynamically adds a React referenceObject to each chapter in fetched document.
   * it is used by scrollIntoView in the plugin to be able to scroll to a certain chapter/header
   *
   * @memberof DocumentHandlerModel
   */
  setScrollReferences = (chapter) => {
    chapter.scrollRef = React.createRef();
    if (chapter.chapters.length > 0) {
      chapter.chapters.forEach((child) => {
        this.setScrollReferences(child);
      });
    }
  };

  setInternalId(chapter) {
    chapter.id = this.internalId;
    if (chapter.chapters.length > 0) {
      chapter.chapters.forEach((child) => {
        this.internalId = this.internalId + 1;
        this.setInternalId(child);
      });
    }
  }

  /**
   * @summary Dynamically adds a object to each chapter in fetched document.
   * it is used to keep track of the parent when changing menu-views in application
   *
   * @memberof DocumentHandlerModel
   */
  setParentChapter(chapter, parent) {
    chapter.parent = parent;
    if (chapter.chapters.length > 0) {
      chapter.chapters.forEach((child) => {
        this.setParentChapter(child, chapter);
      });
    }
  }
}
