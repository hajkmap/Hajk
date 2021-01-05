import React from "react";
import AcUnitIcon from "@material-ui/icons/AcUnit";
import MatchSearch from "./MatchSearch";
import { v4 as uuidv4 } from "uuid";
import { getStringArray } from "../utils/helpers";

export default class DocumentSearchModel {
  constructor(settings) {
    this.settings = settings;
    this.allDocuments = settings.allDocuments;
    this.featureCollectionsToSearch = this.allDocuments.reduce(
      (featureCollections, document) => {
        let features = this.getFeatures(document.chapters, document);
        if (document.documentTitle) {
          features[0].searchValues.push(document.documentTitle);
        }

        return [
          ...featureCollections,
          this.getFeatureCollection(features, document),
        ];
      },
      []
    );
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
      console.log(chapter, "chapter");
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
      resolve({
        featureCollections: this.getFeatureCollectionsForMatchingDocuments(
          this.getPossibleSearchCombinations(searchString)
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
        feature.matchedSearchValues = this.getMatchedSearchValues(
          possibleSearchCombinations,
          feature.searchValues
        );

        return feature.matchedSearchValues.length > 0
          ? [...matchedFeatures, feature]
          : matchedFeatures;
      },
      []
    );
  };

  getUpdatedFeatureCollection = (matchedFeatures, searchFields) => {
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
        id: `${document.documentFileName}`,
        caption: "Dokument",
        displayFields: ["header"],
        searchFields: [...searchFields],
      },
      origin: "DOCUMENT",
    };
  };

  getFeatureCollectionsForMatchingDocuments = (possibleSearchCombinations) => {
    return this.featureCollectionsToSearch.reduce(
      (featureCollections, docFeatureCollection) => {
        const matchedFeatures = this.getMatchedFeatures(
          docFeatureCollection,
          possibleSearchCombinations
        );

        const searchFields = this.getSearchFields(matchedFeatures);
        const featureCollection = this.getUpdatedFeatureCollection(
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

  getPossibleSearchCombinations = (searchString) => {
    let possibleSearchCombinations = [];
    let wordsInTextField = getStringArray(searchString);
    if (wordsInTextField.length > 1) {
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
    } else {
      possibleSearchCombinations.push([searchString]);
    }

    return possibleSearchCombinations;
  };

  getMockedSearchFieldForChapter = (feature) => {
    return feature.matchedSearchValues.reduce((searchFields, searchValue) => {
      const searchField = uuidv4();

      if (!this.arrayContainsString(searchFields, searchField, true)) {
        searchFields = [...searchFields, searchField];
      }
      if (
        this.arrayContainsString(feature.matchedSearchValues, searchValue, true)
      ) {
        feature.properties[searchField] = searchValue;
      } else {
        feature.properties[searchField] = "";
      }
      return searchFields;
    }, []);
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
        let matchedSearchValues = this.getMatched(word, searchValues);
        allMatched = allMatched.concat(matchedSearchValues);
        return matchedSearchValues.length > 0;
      });

      return everyResult;
    });

    return match ? allMatched : [];
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

  getMatched = (searchString, searchFields) => {
    return searchFields.reduce((matchedSearchValues, searchField) => {
      let match = this.matchSearch.compare(searchString, searchField)
        .searchResults.match;
      if (
        match &&
        !this.arrayContainsString(matchedSearchValues, searchField, true)
      ) {
        return [...matchedSearchValues, searchField];
      }
      return matchedSearchValues;
    }, []);
  };
}
