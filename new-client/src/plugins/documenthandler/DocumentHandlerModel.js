import React from "react";
import AcUnitIcon from "@material-ui/icons/AcUnit";
import MatchSearch from "./MatchSearch";

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
    this.implementSearchInterface();
    this.getAllDocumentsContainedInMenu().then((allDocuments) => {
      this.allDocuments = allDocuments;
    });
  }

  implementSearchInterface = () => {
    this.settings.searchInterface.getResults = this.getResults;
    this.settings.searchInterface.getFunctionality = this.getSearchFunctionality;
  };

  getSearchFunctionality = () => {
    return {
      name: "Dokumentverktyg",
      icon: <AcUnitIcon />,
      type: "EXTERNAL_PLUGIN",
      searchFunctionalityClickName: "documenthandler-searchfunctionality-click",
    };
  };

  createFeatureCollection = (document) => {
    return {
      value: {
        status: "fulfilled",
        type: "FeatureCollection",
        crs: { type: null, properties: { name: null } },
        features: this._matchedChapters,
        numberMatched: this._matchedChapters.length,
        numberReturned: this._matchedChapters.length,
        timeStamp: null,
        totalFeatures: this._matchedChapters.length,
      },
      source: {
        id: `${document.documentTitle}`,
        caption: document.documentTitle,
        displayFields: ["header"],
        searchFields: [...this.keywords],
      },
      origin: "DOCUMENT",
    };
  };

  getResults = (searchString, searchOptions) => {
    this.keywords = [];
    let featureCollections = [];
    this.allDocuments.forEach((document) => {
      this._matchedChapters = [];
      this.lookup(document, searchString, searchOptions);
      if (this._matchedChapters.length > 0) {
        featureCollections.push(this.createFeatureCollection(document));
      }
    });

    return new Promise((resolve, reject) => {
      resolve({ featureCollections: featureCollections, errors: [] });
    });
  };

  splitAndTrimOnCommas = (searchString) => {
    return searchString.split(",").map((string) => {
      return string.trim();
    });
  };

  getStringArray = (searchString) => {
    let tempStringArray = this.splitAndTrimOnCommas(searchString);
    return tempStringArray.join(" ").split(" ");
  };

  getPossibleSearchCombinations = (searchString, searchOptions) => {
    let possibleSearchCombinations = [];
    let wordsInTextField = this.getStringArray(searchString);

    for (let i = 0; i < wordsInTextField.length; i++) {
      let combination = wordsInTextField.slice(wordsInTextField.length - i);
      combination.unshift(
        wordsInTextField
          .slice(0, wordsInTextField.length - i)
          .join()
          .replace(/,/g, " ")
      );
      possibleSearchCombinations.push(combination);
    }
    return this.addPotentialWildCards(
      possibleSearchCombinations,
      searchOptions
    );
  };

  addPotentialWildCards = (possibleSearchCombinations, searchOptions) => {
    return possibleSearchCombinations.map((wordArray) => {
      return wordArray.map((word) => {
        word = searchOptions.wildcardAtStart ? `*${word}` : word;
        word = searchOptions.wildcardAtEnd ? `${word}*` : word;
        return word;
      });
    });
  };

  getChaptersMatchingSearchCombination = (
    document,
    chapter,
    searchCombination
  ) => {
    if (chapter.chapters && chapter.chapters.length > 0) {
      chapter.chapters.forEach((subChapter) => {
        this.getChaptersMatchingSearchCombination(
          document,
          subChapter,
          searchCombination
        );
      });
    }
    if (chapter.keywords) {
      chapter.keywords.push(chapter.header);
    } else {
      chapter.keywords = [chapter.header];
    }
    let matchedKeywords = this.chapterMatchSearchInput(
      chapter,
      searchCombination
    );

    if (matchedKeywords.length > 0) {
      this._matchedChapters.push(
        this.createFeatureFromChapter(document, chapter, matchedKeywords)
      );
    }
  };

  createFeatureFromChapter = (document, chapter, matchedKeywords) => {
    let properties = {
      header: chapter.header,
      geoids: chapter.geoids,
      headerIdentifier: chapter.headerIdentifier,
      documentTitle: document.documentTitle,
      documentFileName: document.documentFileName,
    };

    matchedKeywords.map((keyword, index) => {
      if (!this.arrayContainsString(this.keywords, `keyword${index}`, true)) {
        this.keywords.push(`keyword${index}`);
      }
      if (
        matchedKeywords.some((matchedKey) => {
          return matchedKey.toLowerCase() === keyword.toLowerCase();
        })
      ) {
        return (properties[`keyword${index}`] = keyword);
      } else {
        return (properties[`keyword${index}`] = "");
      }
    });

    return {
      type: "Feature",
      geometry: null,
      id: `${document.documentTitle}${Math.floor(Math.random() * 1000)}`,
      onClickName: "documenthandler-searchresult-clicked",
      properties: properties,
    };
  };

  chapterMatchSearchInput = (chapter, searchCombination) => {
    let matchedKeyword = [];
    let match = searchCombination.every((word) => {
      matchedKeyword = matchedKeyword.concat(
        this.searchStringMatchKeywords(word, chapter.keywords)
      );
      return this.searchStringMatchKeywords(word, chapter.keywords).length > 0;
    });

    if (match) {
      return matchedKeyword;
    } else {
      return [];
    }
  };

  lookup = (document, searchString, searchOptions) => {
    let possibleSearchCombinations = [];

    if (searchString !== "") {
      if (searchOptions.getPossibleCombinations) {
        possibleSearchCombinations = this.getPossibleSearchCombinations(
          searchString,
          searchOptions
        );
      } else {
        possibleSearchCombinations.push(
          this.splitAndTrimOnCommas(searchString)
        );
        possibleSearchCombinations = this.addPotentialWildCards(
          possibleSearchCombinations,
          searchOptions
        );
      }
    }

    document.chapters.forEach((chapter) => {
      possibleSearchCombinations.map((searchCombination, index) => {
        return this.getChaptersMatchingSearchCombination(
          document,
          chapter,
          searchCombination
        );
      });
    });
  };

  arrayContainsString(array, string, ignoreCase) {
    return array.some((word) => {
      if (ignoreCase) {
        return word.toLowerCase() === string.toLowerCase();
      } else {
        return word === string;
      }
    });
  }

  /**
   * Perform a search match between the search string and all keywords.
   * @param {string} searchString The search string.
   * @param {array} keywords The chapter's keywords.
   * @return Returns true if a match is found.
   *
   */
  searchStringMatchKeywords = (searchString, keywords) => {
    let matchSearch = new MatchSearch(0.8);
    let matchedKeywords = [];
    keywords.forEach((keyword) => {
      let compareResults = matchSearch.compare(searchString, keyword);
      if (
        compareResults.searchResults.match &&
        !this.arrayContainsString(matchedKeywords, keyword, true)
      ) {
        matchedKeywords.push(keyword);
      }
    });

    return matchedKeywords;
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
          this.allDocuments = documents;
          resolve();
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
