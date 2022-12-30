import { GeoJSON, WFS } from "ol/format";
import GML2 from "ol/format/GML2";
import GML3 from "ol/format/GML3";
import GML32 from "ol/format/GML32";

import IsLike from "ol/format/filter/IsLike";
import EqualTo from "ol/format/filter/EqualTo";
import Or from "ol/format/filter/Or";
import And from "ol/format/filter/And";
import Intersects from "ol/format/filter/Intersects";
import Within from "ol/format/filter/Within";
import { fromCircle } from "ol/geom/Polygon";

// import { arraySort } from "../utils/ArraySort";
import { decodeCommas } from "../utils/StringCommaCoder";
import { hfetch } from "utils/FetchWrapper";
import { functionalOk } from "./Cookie";
import LocalStorageHelper from "./../utils/LocalStorageHelper";

const ESCAPE_CHAR = "!";
const SINGLE_CHAR = ".";
const WILDCARD_CHAR = "*";

class SearchModel {
  // Public field declarations (why? https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes#Defining_classes)

  // Private fields (see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Class_fields#Private_fields)
  #searchOptions = {
    activeSpatialFilter: "intersects", // Make it possible to control which filter is used
    featuresToFilter: [], // features, who's geometries will be read and used to limit the search extent
    maxResultsPerDataset: 100, // how many results to get (at most), per dataset
    matchCase: false, // should search be case sensitive?
    wildcardAtStart: false, // should the search string start with the wildcard character?
    wildcardAtEnd: true, // should the search string be end with the wildcard character?
  };

  #componentOptions;
  #searchSources;
  #map;
  #app;

  #controllers = []; // Holder Array for Promises' AbortControllers
  #wfsParser = new WFS();
  #possibleSearchCombinations = new Map(); // Will hold a set of possible search combinations, so we don't have to re-create them for each source

  constructor(searchPluginOptions, map, app) {
    // Validate
    if (!searchPluginOptions || !map || !app) {
      throw new Error(
        "One of the required parameters for SearchModel is missing."
      );
    }

    this.#componentOptions = searchPluginOptions; // FIXME: Options, currently from search plugin
    this.#map = map; // The OpenLayers map instance
    this.#app = app; // Supplies appConfig and globalObserver
    this.#searchSources = this.#componentOptions.sources;
  }

  /**
   * @summary The main public method of the Search model. Ensures that the search string
   * is trimmed form whitespace and that the return value is standardized (object of collections and errors).
   *
   * @returns {Object} Contains feature collections and error
   *
   * @memberof SearchModel
   */
  getResults = async (
    searchString,
    searchSources = this.getSources(),
    searchOptions = this.getSearchOptions()
  ) => {
    searchString = searchString.trim();

    const { featureCollections, errors } = await this.#getRawResults(
      searchString, // Ensure that the search string isn't surrounded by whitespace
      searchSources,
      searchOptions
    );

    // If the method was initiated by an actual search (not just autocomplete),
    // let's send this to the analytics model.
    if (searchOptions.initiator === "search" && searchString.length > 0) {
      let totalHits = 0;
      if (featureCollections) {
        featureCollections.forEach((f) => {
          totalHits += f.value.features.length;
        });
      }

      // Lets focus on the first error.
      const errorMessage = errors.length
        ? `${errors[0].status}: ${errors[0].reason}`
        : "";

      // track!
      this.#app.globalObserver.publish("analytics.trackEvent", {
        eventName: "textualSearchPerformed",
        query: searchString,
        activeMap: this.#app.config.activeMap,
        totalHits: totalHits,
        errorMessage: errorMessage,
      });
    }

    return { featureCollections, errors };
  };

  abort = () => {
    if (this.#controllers.length > 0) {
      this.#controllers.forEach((controller) => {
        controller.abort();
      });
    }

    // Clean up our list of AbortControllers
    this.#controllers = [];
    return true;
  };

  getSearchOptions = () => {
    return this.#searchOptions;
  };

  getSources = () => {
    return this.#searchSources;
  };

  #getRawResults = async (
    searchString = "",
    searchSources = this.getSources(),
    searchOptions = null
  ) => {
    // If searchSources is explicitly provided as an empty Array, something's wrong. Abort.
    if (Array.isArray(searchSources) && searchSources.length === 0) {
      throw new Error("No search sources selected, aborting.");
    }

    // If searchSources is something else than an Array, use the default search sources.
    if (Array.isArray(searchSources) === false) {
      console.warn("searchSources empty, resetting to default.", searchSources);
      searchSources = this.getSources();
    }

    // Will hold our Promises, one for each search source
    const promises = [];

    // Will hold the end results
    let rawResults = null;

    // Ensure that we've cleaned obsolete AbortControllers before we put new ones there
    this.#controllers = [];

    const viewProjection = this.#map.getView().getProjection().getCode();

    // Loop through all defined search sources
    searchSources.forEach((searchSource) => {
      // Expect the Promise and an AbortController from each Source
      const { promise, controller } = this.#lookup(
        searchString,
        searchSource,
        searchOptions
      );

      // If #lookup returned actual Promise and Controller objects, push
      // them to our array of promises. Important that we don't push empty
      // values to the array, hence this check!
      if (promise !== null && controller !== null) {
        // Push promises to local Array so we can act when all Promises have resolved
        promises.push(promise);

        // Also, put AbortController to the global collection of controllers, so we can abort searches at any time
        this.#controllers.push(controller);
      }
    });

    // Start fetching, allow both fulfilled and rejected Promises
    const fetchResponses = await Promise.allSettled(promises);

    // fetchedResponses will be an array of Promises in object form.
    // Each object will have a "status" and a "value" property.
    const responsePromises = await Promise.allSettled(
      fetchResponses.map((fetchResponse, i) => {
        // We look at the status and filter out only those that fulfilled.
        if (fetchResponse.status === "rejected")
          return Promise.reject("Could not fetch");
        // If we requested GeoJSON, we can try parsing it with
        // the Promise's body's .json() method.
        switch (searchSources[i].outputFormat) {
          case "application/json":
          case "application/vnd.geo+json":
            return fetchResponse.value.json();
          // Otherwise we should expect XML, which needs to be parsed
          // as text
          case "GML2":
          case "GML3":
          case "GML32":
            return fetchResponse.value.text();
          default:
            return Promise.reject("Output format now allowed");
        }
      })
    );

    // Prepare two arrays that will hold our successful and
    // failed responses
    const successfulResponses = [];
    const errors = [];

    // Investigate each response and put in the correct collection,
    // depending on if it succeeded or failed.
    responsePromises.forEach((r, i) => {
      if (r.status === "fulfilled") {
        r.source = searchSources[i];
        r.origin = "WFS";
        successfulResponses.push(r);
      } else if ((r) => r.status === "rejected") {
        r.source = searchSources[i];
        r.origin = "WFS";
        errors.push(r);
      }
    });

    // Do some magic on our valid results
    successfulResponses.forEach((r) => {
      // FIXME: Investigate if this sorting is really needed, and if so,
      // if we can find some Unicode variant and not only for Swedish characters.
      // FIXME: NB: This can't be done like this as it only works for GeoJSON
      // responses. GML won't have an object assigned to r.value, so there won't
      // be any "features" that can be sorted like this (in GML response, the r.value
      // is a XML string).
      // if (r.value?.features?.length > 0) {
      //   arraySort({
      //     array: r.value.features,
      //     index: r.source.searchFields[0],
      //   });
      // }

      switch (r.source.outputFormat) {
        case "application/json":
        case "application/vnd.geo+json": {
          // If the CRS object is lacking in the GeoJSON response, we can
          // safely assume that the geometries are in the standard-compilant
          // WGS84 (EPSG:4326).
          const parserOptions = r.value.crs
            ? {}
            : {
                dataProjection: "EPSG:4326", //FIXME: Only valid for GeoJSON responses!
                featureProjection: viewProjection,
              };

          // Parse the GeoJSON object, optionally supplying the options if needed (see above ^)
          const olFeatures = new GeoJSON().readFeatures(r.value, parserOptions);
          r.value = { features: olFeatures };
          break;
        }
        case "GML2":
        case "GML3":
        case "GML32": {
          let parser = null;
          if (r.source.outputFormat === "GML2") {
            parser = new GML2();
          } else if (r.source.outputFormat === "GML3") {
            parser = new GML3();
          } else if (r.source.outputFormat === "GML32") {
            parser = new GML32();
          }
          const olFeatures = parser.readFeatures(r.value);
          r.value = { features: olFeatures };
          break;
        }

        default:
          throw new Error("Unknown output format");
      }
    });

    // Return an object with out results and errors
    rawResults = { featureCollections: successfulResponses, errors };

    return rawResults;
  };

  #getOrFilter = (word, searchSource, searchOptions) => {
    let orFilter = new Or(
      ...searchSource.searchFields.map((searchField) => {
        return this.#getIsLikeFilter(searchField, word, searchOptions);
      })
    );
    return orFilter;
  };

  #getIsLikeFilter = (searchField, word, searchOptions) => {
    return new IsLike(
      searchField,
      word,
      WILDCARD_CHAR, // wildcard char
      SINGLE_CHAR, // single char
      ESCAPE_CHAR, // escape char
      searchOptions.matchCase // match case
    );
  };

  #getSearchFilters = (wordsArray, searchSource, searchOptions) => {
    if (searchSource.searchFields.length > 1) {
      let OrFilters = wordsArray.map((word) => {
        return this.#getOrFilter(word, searchSource, searchOptions);
      });
      if (OrFilters.length > 1) {
        return new And(...OrFilters);
      } else {
        return OrFilters[0];
      }
    } else {
      let isLikeFilters = wordsArray.map((word) => {
        return this.#getIsLikeFilter(
          searchSource.searchFields[0],
          word,
          searchOptions
        );
      });
      if (isLikeFilters.length > 1) {
        return new And(...isLikeFilters);
      } else {
        return isLikeFilters[0];
      }
    }
  };

  #getStringArray = (searchString) => {
    let tempStringArray = this.#splitAndTrimOnCommas(searchString);
    return tempStringArray.join(" ").split(" ");
  };

  #splitAndTrimOnCommas = (searchString) => {
    return searchString.split(",").map((string) => {
      return string.trim();
    });
  };

  #escapeSpecialChars = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "!$&"); // $& means the whole matched string
  };

  getPossibleSearchCombinations = (searchString) => {
    // See if we've already created possible search combos for the specified string,
    // if so, do an early return
    if (this.#possibleSearchCombinations.has(searchString)) {
      return Array.from(this.#possibleSearchCombinations.get(searchString));
    }

    // Looks like the specified string hasn't been requested yet: let's create
    // an array of possible combos.
    const possibleSearchCombinations = new Set();
    const wordsInTextField = this.#getStringArray(searchString);
    const numWords = wordsInTextField.length;

    // If the string contains a comma, we must add the string as is
    // otherwise we might miss cases where the user wants to search
    // for a property with a comma.
    if (searchString.includes(",")) {
      possibleSearchCombinations.add([searchString]);
    }

    // If the user has typed more than five words, we only create
    // one string containing all words to avoid sending humongous
    // requests to geoServer.
    if (numWords > 5) {
      const joinedWord = wordsInTextField.join().replace(/,/g, " ");
      possibleSearchCombinations.add([joinedWord]);
      return Array.from(possibleSearchCombinations);
    }

    possibleSearchCombinations.add(wordsInTextField);

    if (numWords > 1) {
      for (let i = 0; i < numWords; i++) {
        this.#getPossibleForwardCombinations(
          i,
          wordsInTextField,
          possibleSearchCombinations
        );
      }
    }

    // Let's save the results for later use - we don't want to re-create
    // the possible combos array for the same search string
    this.#possibleSearchCombinations.set(
      searchString,
      possibleSearchCombinations
    );

    return Array.from(possibleSearchCombinations);
  };

  #getPossibleForwardCombinations = (
    index,
    stringArray,
    possibleSearchCombinations
  ) => {
    const wordsBeforeCurrent = stringArray.slice(0, index);

    for (let ii = index; ii < stringArray.length - 1; ii++) {
      const currentWord = stringArray
        .slice(index, ii + 2)
        .join()
        .replace(/,/g, " ");

      const wordsAfterCurrent = stringArray.slice(ii + 2);

      possibleSearchCombinations.add([
        ...wordsBeforeCurrent,
        currentWord,
        ...wordsAfterCurrent,
      ]);
    }
  };

  #addPotentialWildCards = (word, searchOptions) => {
    word = searchOptions.wildcardAtStart ? `*${word}` : word;
    word = searchOptions.wildcardAtEnd ? `${word}*` : word;
    return word;
  };

  #decodePotentialSpecialChars = (searchCombinations) => {
    return searchCombinations.map((combination) => {
      return combination.map((word) => {
        // Replace all occurrences of a backslash with 2 backslashes (which will be seen
        // by GeoServer as "one escaped backslash"). Hence the 4 backslashes in replacement string,
        // they are basically two escaped backslashes after each other.
        return decodeCommas(word).replace(/\\/g, "\\\\");
      });
    });
  };

  #lookup = (searchString, searchSource, searchOptions) => {
    const srsName = this.#map.getView().getProjection().getCode();
    const geometryName =
      searchSource.geometryField || searchSource.geometryName || "geom";
    const maxFeatures = searchOptions.maxResultsPerDataset;
    let comparisonFilters = null;
    let spatialFilters = null;
    let globalCqlFilter = null;
    let finalFilters = null;
    let possibleSearchCombinations = [];

    // In order to do a textual search, we must have both a search phrase
    // and at least one search field (else there's no way to know where to search!)
    if (searchString !== "" && searchSource.searchFields.length > 0) {
      if (searchOptions.getPossibleCombinations) {
        possibleSearchCombinations =
          this.getPossibleSearchCombinations(searchString);
      } else {
        possibleSearchCombinations.push(
          this.#splitAndTrimOnCommas(searchString)
        );
      }

      possibleSearchCombinations = this.#decodePotentialSpecialChars(
        possibleSearchCombinations
      );

      const searchFilters = possibleSearchCombinations.map((combination) => {
        let searchWordsForCombination = combination.map((wordInCombination) => {
          wordInCombination = this.#escapeSpecialChars(wordInCombination);
          wordInCombination = this.#addPotentialWildCards(
            wordInCombination,
            searchOptions
          );
          return wordInCombination;
        });
        return this.#getSearchFilters(
          searchWordsForCombination,
          searchSource,
          searchOptions
        );
      });

      comparisonFilters =
        searchFilters.length > 1 ? new Or(...searchFilters) : searchFilters[0];
    }

    // If searchOptions contain any features, we should filter the results
    // using those features.
    if (searchOptions.featuresToFilter.length > 0) {
      // First determine which spatial filter should be used:
      const activeSpatialFilter =
        searchOptions.activeSpatialFilter === "within" ? Within : Intersects;
      // Next, loop through supplied features and create the desired filter
      spatialFilters = searchOptions.featuresToFilter.map((feature) => {
        // If the drawn feature that we want to use as a filter happens to be an
        // OpenLayers Circle feature, we must convert it to a polygon. (GML only
        // accepts the following operands: Point, LineString, Polygon, Envelope.)
        // If it's not a Circle however, let's clone the geometry, to avoid
        // modifying the geometry that belongs to the feature that  will be used
        // throughout the loop (see also "Fix for QGIS" below).
        const geometry =
          feature.getGeometry().getType() === "Circle"
            ? fromCircle(feature.getGeometry())
            : feature.getGeometry().clone();

        // Fix for QGIS Server: for some unknown reasons QGIS doesn't want the Polygon
        // to be closed. We fix it by basically removing the last two elements of the
        // flatCoordinates array, effectively eliminating the last point of the polygon.
        // See also: https://github.com/hajkmap/Hajk/issues/882#issuecomment-956099289
        searchSource.serverType === "qgis" &&
          geometry.flatCoordinates.splice(-2, 2);
        return new activeSpatialFilter(geometryName, geometry, srsName);
      });

      // If one feature was supplied, we end up with one filter. Let's use it.
      // But if more features were supplied, we must combine them into an Or filter.
      spatialFilters =
        spatialFilters.length > 1
          ? new Or(...spatialFilters)
          : spatialFilters[0];
    }

    // Check if we have a 'global' filter that is stored (for now) in localStorage.
    // This can have been set by tools that want to apply a filter to many different map layers (for example to view a particular floor).
    // If such a filter is set, we would take it into account in the search, by adding an additional And filter once the rest of the search filters are set up.
    // We should potentially put the global filter in a better place as there is no real need to have it in localStorage and as a result unnecessarily be dependent on functional cookies being accepted.

    //Example globalFilterOptions: {filter: 'LevelId = 155', filterProperty: "LevelId", filterValue: "155", layers: ["1", "2", "3"]}
    if (functionalOk) {
      const globalFilterOptions = LocalStorageHelper.get(
        "globalCqlFilter",
        null
      );

      // If we have a globalFilterOptions object stored, and the layer being searched is in the list of layers where the globalFilter
      // should be applied, we create an extra search filter. OBS. At the moment, the globalFilter is a simple EqualTo.
      // We will later add this as an And filter to the final search filters, once they are prepared.
      if (globalFilterOptions && globalFilterOptions?.layers) {
        if (globalFilterOptions.layers.includes(searchSource.id)) {
          globalCqlFilter = new EqualTo(
            globalFilterOptions.filterProperty,
            globalFilterOptions.filterValue,
            false
          );
        }
      }
    }

    // Finally, let's combine the text and spatial filters into
    // one filter that will be sent with the request.
    if (comparisonFilters !== null && spatialFilters !== null) {
      // We have both text and spatial filters - let's combine them with an And filter.
      finalFilters = new And(comparisonFilters, spatialFilters);
    } else if (comparisonFilters !== null) {
      finalFilters = comparisonFilters;
    } else if (spatialFilters !== null) {
      finalFilters = spatialFilters;
    }

    //If we have a globalFilter, add this as an And filter to the final search filters.
    if (globalCqlFilter !== null) {
      finalFilters = new And(finalFilters, globalCqlFilter);
    }

    // Before we actually send a fetch request, we must ensure
    // that it won't be empty, i.e. we must have at least one filter.
    // The reason where this can be empty is if _user tries to do a
    // textual search on a layer that lacks searchFields_. Those layers
    // are still usable (we don't need to defined searchFields for spatial
    // searches), so admins may have setup a layer like this. And in that
    // case, it's crucial that we don't do a GetFeature to the WFS that doesn't
    // contain any filters.
    // The return value of this method must be an object that contains a promise
    // and controller property (because the return value is used in a destruction
    // assignment later on), hence this odd return, instead of just a null value.
    if (finalFilters === null) {
      return { promise: null, controller: null };
    }

    // Prepare the options for the upcoming request.
    const options = {
      featureTypes: searchSource.layers,
      srsName: srsName,
      outputFormat: searchSource.outputFormat,
      geometryName: geometryName,
      maxFeatures: maxFeatures,
      filter: finalFilters,
    };

    const node = this.#wfsParser.writeGetFeature(options);
    const xmlSerializer = new XMLSerializer();
    const xmlString = xmlSerializer.serializeToString(node);
    const controller = new AbortController();
    const signal = controller.signal;

    const request = {
      credentials: "same-origin",
      signal: signal,
      method: "POST",
      headers: {
        "Content-Type": "text/xml",
      },
      body: xmlString,
    };
    const promise = hfetch(
      this.#app.config.appConfig.searchProxy + searchSource.url,
      request
    );

    return { promise, controller };
  };
}

export default SearchModel;
