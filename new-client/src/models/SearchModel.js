import Observer from "react-event-observer";
import { WFS } from "ol/format";
import IsLike from "ol/format/filter/IsLike";
import Or from "ol/format/filter/Or";

import { arraySort } from "../utils/ArraySort";

class SearchModel {
  // Public field declarations (why? https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes#Defining_classes)
  localObserver = new Observer();

  // Private fields (see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Class_fields#Private_fields)
  #searchOptions = {
    featuresToFilter: [],
    maxResultsPerDataset: 100, // how many results to get (at most), per dataset
    wildcardAtStart: false, // should the search string start with the wildcard character?
    wildcardAtEnd: true, // should the search string be end with the wildcard character?
    matchCase: false // should search be case sensitive?
  };

  #componentOptions;
  #searchSources;
  #map;
  #app;

  #controllers = []; // Holder Array for Promises' AbortControllers
  #wfsParser = new WFS();

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

    // Just a demo - we don't need to subscribe internally, but I wanted this to be explicit for anyone wondering.
    this.localObserver.subscribe("searchCompleted", e =>
      console.log("DEMO USE OF LOCAL OBSERVER", e)
    );

    console.log("SearchModel initiated!", this);
  }

  /**
   * @summary Grab results for @param {String} searchString and prepare an array to be sent into the Autocomplete component.
   *
   * @param {String} searchString The search string as typed in by the user.
   * @param {Object} [options=null] Options to be sent with this request.
   * @returns {Array} All matching results to be displayed in Autocomplete.
   */
  getAutocomplete = async (
    searchString,
    searchSources = this.getSources(),
    searchOptions = this.getSearchOptions()
  ) => {
    // Grab raw results from the common private function
    const featureCollections = await this.#getRawResults(
      searchString,
      searchSources,
      searchOptions
    );

    // Generate an array with results, one per dataset (dataset = search source)
    const resultsPerDataset = featureCollections.map(featureCollection => {
      return featureCollection.features.map(feature => {
        const autocompleteEntry = this.#mapDisplayFieldsInFeature(
          feature.properties,
          featureCollection.source.displayFields
        );
        const dataset = featureCollection.source.caption;
        return {
          dataset,
          autocompleteEntry
        };
      });
    });

    // resultsPerDataset is an Array of Arrays. We need ONE Array, so we flatten it:
    const results = resultsPerDataset.reduce((a, b) => a.concat(b), []);

    this.localObserver.publish("searchCompleted", {
      reason: "autocomplete",
      results
    });

    return results;
  };

  getResults = async (
    searchString,
    searchSources = this.getSources(),
    searchOptions = this.getSearchOptions()
  ) => {
    console.log(
      "searchString, searchSources, searchOptions: ",
      searchString,
      searchSources,
      searchOptions
    );

    const results = await this.#getRawResults(
      searchString,
      searchSources,
      searchOptions
    );

    this.localObserver.publish("searchCompleted", {
      reason: "textSearch",
      results
    });

    return results;
  };

  abort = () => {
    if (this.#controllers.length > 0) {
      this.#controllers.forEach(controller => {
        controller.abort();
        this.localObserver.publish("searchCompleted", { reason: "aborted" });
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

  /**
   * @summary Use FeatureCollection's selected displayFields to create a relevant string to display autocomplete results.
   *
   * @param {Object} featureProperties Key-value pair where KEY corresponds to one of the keys in displayFields.
   * @param {Array} displayFields Selection of fields that will be used to read out values from featureProperties.
   * @returns {String} Comma-separated string of values according to selection and order in displayFields.
   */
  #mapDisplayFieldsInFeature = (featureProperties, displayFields) => {
    return displayFields.map(df => featureProperties[df]).join(", ");
  };

  #getRawResults = async (
    searchString,
    searchSources = this.getSources(),
    searchOptions = null
  ) => {
    // TODO: Handle empty/null/undefined searchString (can happen on spatial search)
    // TODO: Handle empty/null/undefined searchSources (should search in all sources)
    // Fast fail if no search string provided
    // if (searchString === null) return [];

    const promises = [];
    let rawResults = null;
    console.log(`Will look for ${searchString} in sources:`, searchSources);

    // Ensure that we've cleaned obsolete AbortControllers before we put new ones there
    this.#controllers = [];

    // Loop through all defined search sources
    searchSources.forEach(searchSource => {
      // Expect the Promise and an AbortController from each Source
      const { promise, controller } = this.#lookup(
        searchString,
        searchSource,
        searchOptions
      );

      // Push promises to local Array so we can act when all Promises have resolved
      promises.push(promise);

      // Also, put AbortController to the global collection of controllers, so we can abort searches at any time
      this.#controllers.push(controller);
    });

    await Promise.all(promises)
      .then(async responses => {
        await Promise.all(responses.map(result => result.json()))
          .then(jsonResults => {
            jsonResults.forEach((jsonResult, i) => {
              if (jsonResult.features.length > 0) {
                arraySort({
                  array: jsonResult.features,
                  index: this.#componentOptions.sources[i].searchFields[0]
                });
              }
              jsonResult.source = this.#componentOptions.sources[i];
            });
            rawResults = jsonResults;
            return rawResults;
          })
          .catch(parseErrors => {
            console.error("parseErrors: ", parseErrors);
          });
      })
      .catch(responseErrors => {
        console.error("responseErrors: ", responseErrors);
      });

    console.log("rawResults: ", rawResults);
    return rawResults || [];
  };

  #lookup = (searchString, searchSource, searchOptions) => {
    console.log("#lookup searchString: ", searchString);
    console.log("#lookup searchSource: ", searchSource);
    console.log("#lookup searchOptions: ", searchOptions);
    const projCode = this.#map
      .getView()
      .getProjection()
      .getCode();

    const maxFeatures = searchOptions.maxResultsPerDataset;

    // Should the search string be surrounded by wildcard?
    let pattern = searchString;
    pattern = searchOptions.wildcardAtStart ? `*${pattern}` : pattern;
    pattern = searchOptions.wildcardAtEnd ? `${pattern}*` : pattern;

    const isLikeFilters = searchSource.searchFields.map(propertyName => {
      return new IsLike(
        propertyName,
        pattern,
        "*", // wildcard char
        ".", // single char
        "!", // escape char
        searchOptions.matchCase // match case
      );
    });

    // TODO: Actually apply filters based on geometries from features (if provided)
    const filters = searchOptions.featuresToFilter.map(feature => {
      // FIXME: new Intersects(finalGeom, geometry, projCode)
      return feature.getGeometry();
    });
    console.log("WILL APPLY filters: ", filters);

    const filter =
      isLikeFilters.length > 1 ? new Or(...isLikeFilters) : isLikeFilters[0];

    const options = {
      featureTypes: searchSource.layers,
      srsName: projCode,
      outputFormat: "JSON", //source.outputFormat,
      geometryName: searchSource.geometryField,
      maxFeatures,
      filter
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
        "Content-Type": "text/xml"
      },
      body: xmlString
    };
    const promise = fetch(
      this.#app.config.appConfig.searchProxy + searchSource.url,
      request
    );

    return { promise, controller };
  };
}

export default SearchModel;
