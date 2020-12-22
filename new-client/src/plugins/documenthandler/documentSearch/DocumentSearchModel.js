import React from "react";
import AcUnitIcon from "@material-ui/icons/AcUnit";
import MatchSearch from "./MatchSearch";
import { v4 as uuidv4 } from "uuid";

export default class DocumentSearchModel {
  constructor(settings) {
    this.settings = settings;
    this.allDocuments = settings.allDocuments;
    this.searchFeatures = this.allDocuments.reduce((acc, document) => {
      let features = this.getFeatures(document.chapters, document);
      features[0].searchValues.push(document.documentTitle);
      return [...acc, this.getFeatureCollection(features, document)];
    }, []);
  }

  getFeatureCollection = (features, document) => {
    return {
      value: {
        status: "fulfilled",
        type: "FeatureCollection",
        crs: { type: null, properties: { name: null } },
        features: features,
        numberMatched: 0,
        numberReturned: 0,
        timeStamp: null,
        totalFeatures: 0,
      },
      source: {
        id: `${document.documentFileName}`,
        caption: "Dokument",
        displayFields: ["header"],
        searchFields: [],
      },
      origin: "DOCUMENT",
    };
  };

  getFeatures = (chapters, document) => {
    return chapters.reduce((features, chapter) => {
      if (chapter.chapters) {
        features = [
          ...features,
          ...this.getFeatures(chapter.chapters, document),
        ];
      }
      features = [
        ...features,
        this.createFeatureFromChapter(chapter, document),
      ];
      return features;
    }, []);
  };

  createFeatureFromChapter = (chapter, document) => {
    let searchValues = [];
    if (chapter.header) {
      searchValues.push(chapter.header);
    }
    if (chapter.keywords && chapter.keywords.length > 0) {
      searchValues = [...searchValues, ...chapter.keywords];
    }
    let properties = {
      header: chapter.header,
      geoids: chapter.geoids,
      headerIdentifier: chapter.headerIdentifier,
      documentTitle: document.documentTitle,
      documentFileName: document.documentFileName,
    };

    return {
      type: "Feature",
      geometry: null,
      searchValues: searchValues,
      id: `${chapter.headerIdentifier}${Math.floor(Math.random() * 1000)}`,
      onClickName: "documenthandler-searchresult-clicked",
      internalChapterRef: chapter.id,
      properties: properties,
    };
  };

  implementSearchInterface = () => {
    return {
      getResults: this.getResults,
      getFunctionality: this.getFunctionality,
    };
  };

  //Method called by searchComponent in core (Part of searchInterface)
  getFunctionality = () => {
    return {
      name: "Dokumentverktyg",
      icon: <AcUnitIcon />,
      type: "EXTERNAL_PLUGIN",
      searchFunctionalityClickName: "documenthandler-searchfunctionality-click",
    };
  };

  //Method called by searchComponent in core (Part of searchInterface)
  getResults = (searchString, searchOptions) => {
    this.matchSearch = new MatchSearch(searchOptions);
    return this.getDocumentHandlerResults(searchString, searchOptions);
  };

  getDocumentHandlerResults = (searchString, searchOptions) => {
    return new Promise((resolve, reject) => {
      if (searchString === "") {
        resolve({ featureCollections: [], errors: [] });
      }

      let possibleSearchCombinations = this.getPossibleSearchCombinations(
        searchOptions,
        searchString
      );

      resolve({
        featureCollections: this.getFeatureCollectionsForMatchingDocuments(
          possibleSearchCombinations
        ),
        errors: [],
      });
    });
  };

  getSearchFields = (matchedFeatures) => {
    return matchedFeatures.reduce((searchFields, feature) => {
      if (feature.matchedSearchValues.length > 0) {
        searchFields = [
          ...searchFields,
          ...this.getMockedSearchFieldForChapter(feature),
        ];
      }
      return searchFields;
    }, []);
  };

  getMatchedFeatures = (docFeatureCollection, possibleSearchCombinations) => {
    return docFeatureCollection.value.features.reduce(
      (matchedFeatures, feature) => {
        feature.matchedSearchValues = this.setmatchedSearchValuesOnChapter(
          feature,
          possibleSearchCombinations
        );

        return feature.matchedSearchValues.length > 0
          ? [...matchedFeatures, feature]
          : matchedFeatures;
      },
      []
    );
  };

  getUpdatedFeatureCollection = (
    featureCollection,
    matchedFeatures,
    searchFields
  ) => {
    featureCollection.value.features = matchedFeatures;
    featureCollection.source.searchFields = [...searchFields];
    featureCollection.value.numberMatched = matchedFeatures.length;
    featureCollection.value.numberReturned = matchedFeatures.length;
    featureCollection.value.totalFeatures = matchedFeatures.length;
    return featureCollection;
  };

  getFeatureCollectionsForMatchingDocuments = (possibleSearchCombinations) => {
    return this.searchFeatures.reduce(
      (featureCollections, docFeatureCollection) => {
        const matchedFeatures = this.getMatchedFeatures(
          docFeatureCollection,
          possibleSearchCombinations
        );

        const searchFields = this.getSearchFields(matchedFeatures);
        const featureCollection = this.getUpdatedFeatureCollection(
          docFeatureCollection,
          matchedFeatures,
          searchFields
        );

        return featureCollection
          ? [...featureCollections, featureCollection]
          : featureCollections;
      },
      []
    );
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

  hasSubChapters = (chapter) => {
    return chapter.chapters && chapter.chapters.length > 0;
  };

  setmatchedSearchValuesOnChapter = (feature, searchCombinations) => {
    console.log(feature, "featurex");
    let x = this.getMatchedSearchValues(
      searchCombinations,
      feature.searchValues
    );
    console.log(x, "x");
    return x;
  };

  getMockedSearchFieldForChapter = (feature) => {
    let searchFields = [];

    feature.matchedSearchValues.forEach((searchValue, index) => {
      const searchField = uuidv4();
      if (!this.arrayContainsString(searchFields, searchField, true)) {
        searchFields.push(searchField);
      }
      if (
        this.arrayContainsString(feature.matchedSearchValues, searchValue, true)
      ) {
        feature.properties[searchField] = searchValue;
      } else {
        feature.properties[searchField] = "";
      }
    });

    return searchFields;
  };

  /**
   * Sets matchedsearchvalues for each chapter
   * If any (some-function) of the searchcombinations is hit, that is a match
   * For a searchCombination to be a match must every (every-function) searchword in that combination
   * find a match
   * @param {chapter} chapter chapter.
   * @param {array} searchCombinations array with arrays containing searchwords.
   * @return Returns true if a match is found.
   *
   */
  getMatchedSearchValues = (searchCombinations, searchValues) => {
    let allMatched = [];
    let match = searchCombinations.some((searchCombination) => {
      let everyResult = searchCombination.every((word) => {
        let matchedSearchValues = this.getMatchSearchValues(word, searchValues);
        allMatched = allMatched.concat(matchedSearchValues);
        return matchedSearchValues.length > 0;
      });

      return everyResult;
    });

    return match ? allMatched : [];
  };

  getPossibleSearchCombinations = (searchOptions, searchString) => {
    let possibleSearchCombinations = [];
    possibleSearchCombinations.push(this.splitAndTrimOnCommas(searchString));
    // possibleSearchCombinations = this.addPotentialWildCards(
    //   possibleSearchCombinations,
    //   searchOptions
    // );
    return possibleSearchCombinations;
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
  getMatchSearchValues = (searchString, searchFields) => {
    let matchedSearchValues = [];
    searchFields.forEach((searchField) => {
      let compareResults = this.matchSearch.compare(searchString, searchField);

      if (
        compareResults.searchResults.match &&
        !this.arrayContainsString(matchedSearchValues, searchField, true)
      ) {
        matchedSearchValues.push(searchField);
      }
    });

    return matchedSearchValues;
  };
}
