import React from "react";
import AcUnitIcon from "@material-ui/icons/AcUnit";
import MatchSearch from "./MatchSearch";

export default class DocumentSearchModel {
  constructor(settings) {
    this.settings = settings;
    this.allDocuments = settings.allDocuments;
  }

  implementSearchInterface = () => {
    return {
      getResults: this.getResults,
      getFunctionality: this.getFunctionality,
    };
  };

  getFunctionality = () => {
    return {
      name: "Dokumentverktyg",
      icon: <AcUnitIcon />,
      type: "EXTERNAL_PLUGIN",
      searchFunctionalityClickName: "documenthandler-searchfunctionality-click",
    };
  };

  createFeatureCollection = (document, matchedFeatures) => {
    return {
      value: {
        status: "fulfilled",
        type: "FeatureCollection",
        crs: { type: null, properties: { name: null } },
        features: matchedFeatures,
        numberMatched: matchedFeatures.length,
        numberReturned: matchedFeatures.length,
        timeStamp: null,
        totalFeatures: matchedFeatures.length,
      },
      source: {
        id: `${document.documentTitle}`,
        caption: document.documentTitle,
        displayFields: ["header"],
        searchFields: [...this.searchFields],
      },
      origin: "DOCUMENT",
    };
  };

  getResults = (searchString, searchOptions) => {
    return new Promise((resolve, reject) => {
      let featureCollections = [];

      if (searchString === "") {
        resolve({ featureCollections: [], errors: [] });
      }

      let possibleSearchCombinations = this.getPossibleSearchCombinations(
        searchOptions,
        searchString
      );

      this.allDocuments.forEach((document) => {
        this.searchFields = [];
        document.chapters.forEach((chapter) => {
          this.setChapterInformation(
            document,
            chapter,
            possibleSearchCombinations
          );
        });

        let matchedFeatures = [];

        const traverseChapters = (chapters) => {
          for (var i = 0; i < chapters.length; i++) {
            if (this.hasSubChapters(chapters[i])) {
              traverseChapters(chapters[i].chapters);
            }
            if (chapters[i].matchedSearchFields.length > 0) {
              matchedFeatures.push(this.createFeatureFromChapter(chapters[i]));
            }
          }
        };

        traverseChapters(document.chapters);

        if (matchedFeatures.length > 0) {
          featureCollections.push(
            this.createFeatureCollection(document, matchedFeatures)
          );
        }
      });

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

  createSearchFields = (chapter) => {
    chapter.searchFields = [];
    if (chapter.keywords) {
      chapter.searchFields = chapter.searchFields.concat(chapter.keywords);
    }
    chapter.searchFields.push(chapter.header);
  };

  hasSubChapters = (chapter) => {
    return chapter.chapters && chapter.chapters.length > 0;
  };

  setChapterInformation = (document, chapter, searchCombinations) => {
    if (this.hasSubChapters(chapter)) {
      chapter.chapters.forEach((subChapter) => {
        this.setChapterInformation(document, subChapter, searchCombinations);
      });
    }
    this.createSearchFields(chapter);
    this.setDocumentProperties(chapter, document);
    this.setMatchedKeywords(chapter, searchCombinations);
  };

  setDocumentProperties = (chapter, document) => {
    chapter.documentTitle = document.documentTitle;
    chapter.documentFileName = document.documentFileName;
  };

  createFeatureFromChapter = (chapter) => {
    let properties = {
      header: chapter.header,
      geoids: chapter.geoids,
      headerIdentifier: chapter.headerIdentifier,
      documentTitle: chapter.documentTitle,
      documentFileName: chapter.documentFileName,
    };
    chapter.matchedSearchFields.map((searchField, index) => {
      if (
        !this.arrayContainsString(
          this.searchFields,
          `searchField${index}`,
          true
        )
      ) {
        this.searchFields.push(`searchField${index}`);
      }
      if (
        this.arrayContainsString(chapter.matchedSearchFields, searchField, true)
      ) {
        return (properties[`searchField${index}`] = searchField);
      } else {
        return (properties[`searchField${index}`] = "");
      }
    });

    return {
      type: "Feature",
      geometry: null,
      id: `${chapter.documentTitle}${Math.floor(Math.random() * 1000)}`,
      onClickName: "documenthandler-searchresult-clicked",
      properties: properties,
    };
  };

  setMatchedKeywords = (chapter, searchCombinations) => {
    let matchedSearchFields = [];
    let match = searchCombinations.some((searchCombination) => {
      let everyResult = searchCombination.every((word) => {
        matchedSearchFields = matchedSearchFields.concat(
          this.searchStringMatchSearchFields(word, chapter.searchFields)
        );
        return matchedSearchFields.length > 0;
      });

      return everyResult;
    });

    if (match) {
      chapter.matchedSearchFields = matchedSearchFields;
    } else {
      chapter.matchedSearchFields = [];
    }
  };

  /* if (match) {
        console.log(match, "match");
        chapter.matchedSearchFields = chapter.matchedSearchFields.concat(
          matchedSearchFields
        );
      } else {
        chapter.matchedSearchFields = chapter.matchedSearchFields.concat([]);
      }*/

  getPossibleSearchCombinations = (searchOptions, searchString) => {
    let possibleSearchCombinations = [];
    possibleSearchCombinations.push(this.splitAndTrimOnCommas(searchString));
    possibleSearchCombinations = this.addPotentialWildCards(
      possibleSearchCombinations,
      searchOptions
    );
    return possibleSearchCombinations;
  };

  setMatchInformationForDocument = (document, possibleSearchCombinations) => {
    document.chapters.forEach((chapter) => {
      possibleSearchCombinations.forEach((searchCombination) => {
        this.setMatchedSearchFieldOnChapter(
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
  searchStringMatchSearchFields = (searchString, searchFields) => {
    let matchSearch = new MatchSearch(0.8);
    let matchedSearchFields = [];
    searchFields.forEach((searchField) => {
      let compareResults = matchSearch.compare(searchString, searchField);

      if (
        compareResults.searchResults.match &&
        !this.arrayContainsString(matchedSearchFields, searchField, true)
      ) {
        matchedSearchFields.push(searchField);
      }
    });

    return matchedSearchFields;
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
}
