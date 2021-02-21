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
    this.app = settings.app;
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
          globalSearchModel: this.app.searchModel,
        });
        this.settings.resolveSearchInterface(
          this.documentSearchmodel.implementSearchInterface()
        );
      })
      .then(() => {
        return this;
      });
  };

  flattenMenu = (menuItems) => {
    return menuItems.reduce((menu, menuItem) => {
      if (menuItem.menu && menuItem.menu.length > 0) {
        menu = [...menu, ...this.flattenMenu(menuItem.menu)];
      }
      return [...menu, menuItem];
    }, []);
  };

  getAllDocumentsContainedInMenu() {
    return new Promise((resolve, reject) => {
      if (this.allDocuments.length > 0) {
        resolve(this.allDocuments);
      }

      const menuItemsWithDocumentConnetion = this.flattenMenu(
        this.settings.menu
      ).filter((menuItem) => {
        return menuItem.document;
      });

      Promise.all(
        menuItemsWithDocumentConnetion.map((menuItem) => {
          return this.fetchJsonDocument(menuItem.document).then((doc) => {
            if (!doc.title) {
              console.warn(
                `The document ${menuItem.document} is missing a title`
              );
            }

            return {
              ...doc,
              documentColor: menuItem.color,
              documentFileName: menuItem.document,
              documentTitle: doc.title,
            };
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
        document.chapters.forEach((mainChapter) => {
          this.setChapterInfo(mainChapter, 0, document.documentColor);
        });
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
        throw new Error(
          `Could not find document with title ${title} in folder with documents`
        );
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
      console.warn(
        `Kunde inte parsa JSON-dokumentet ${document}, kontrollera så att filen finns och är en .json-fil `
      );
      throw new Error(err);
    }
  }

  findChapters = (chapters, headerIdentifierToFind) => {
    return chapters.reduce((chaptersFound, chapter) => {
      if (chapter.chapters && chapter.chapters.length > 0) {
        chaptersFound = [
          ...chaptersFound,
          ...this.findChapters(chapter.chapters, headerIdentifierToFind),
        ];
      }
      if (chapter.headerIdentifier === headerIdentifierToFind) {
        return [...chaptersFound, chapter];
      }
      return chaptersFound;
    }, []);
  };

  /**
   * @summary method to find a certain chapter in a fetched document with a unique headerGUID.
   * it is used when user clicks a text-link to a certain document and header in the text in the document-window
   *
   * @memberof DocumentHandlerModel
   */
  getHeaderRef = (activeDocument, headerIdentifierToFind) => {
    const foundChapters = this.findChapters(
      activeDocument.chapters,
      headerIdentifierToFind
    );

    if (foundChapters.length > 1) {
      throw new Error("Two chapters with same header identifier found");
    } else {
      return foundChapters[0];
    }
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
