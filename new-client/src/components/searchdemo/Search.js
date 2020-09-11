import React from "react";
import SearchBar from "./SearchBar";
import GeoJSON from "ol/format/GeoJSON";
import { withStyles } from "@material-ui/core/styles";
import { options } from "marked";
import { Vector as VectorLayer } from "ol/layer";
import VectorSource from "ol/source/Vector";
import { Stroke, Style, Circle, Fill } from "ol/style";

const styles = (theme) => ({
  inputRoot: {
    width: "100%",
  },
});

let drawStyle = new Style({
  stroke: new Stroke({
    color: "rgba(255, 214, 91, 0.6)",
    width: 4,
  }),
  fill: new Fill({
    color: "rgba(255, 214, 91, 0.2)",
  }),
  image: new Circle({
    radius: 6,
    stroke: new Stroke({
      color: "rgba(255, 214, 91, 0.6)",
      width: 2,
    }),
  }),
});

class Search extends React.PureComponent {
  state = {
    searchImplementedPlugins: [],
    searchImplementedPluginsLoaded: false,
    searchSources: [],
    searchResults: { featureCollections: [], errors: [] },
    autocompleteList: [],
    searchString: "",
    autoCompleteOpen: false,
    loading: false,
    searchOptions: {
      wildcardAtStart: false,
      wildcardAtEnd: false,
      matchCase: false,
      activeSpatialFilter: "intersects",
    },
  };

  constructor(props) {
    super(props);
    this.map = props.map;
    this.searchModel = props.app.appModel.searchModel;
    this.drawSource = new VectorSource({ wrapX: false });
    this.drawLayer = new VectorLayer({
      source: this.drawSource,
      style: drawStyle,
    });
    this.resultsSource = new VectorSource({ wrapX: false });
    this.resultsLayer = new VectorLayer({
      source: this.resultsSource,
    });
    this.map.addLayer(this.drawLayer);
    this.map.addLayer(this.resultsLayer);
  }

  implementsSearchInterface = (plugin) => {
    var hasGetResultsMethod = plugin.searchInterface.getResults;
    if (!hasGetResultsMethod) {
      console.warn(
        plugin.type +
          " has flag searchImplemented = true but has not implemented correct method in plugin to use search"
      );
    }
    return hasGetResultsMethod;
  };

  getSearchImplementedPlugins = () => {
    const { app } = this.props;
    return Object.values(app.appModel.plugins).filter((plugin) => {
      return (
        plugin.options.searchImplemented &&
        this.implementsSearchInterface(plugin)
      );
    });
  };

  componentDidMount = () => {
    const { app } = this.props;
    app.globalObserver.subscribe("core.appLoaded", () => {
      this.setState({
        searchImplementedPlugins: this.getSearchImplementedPlugins(),
        searchImplementedPluginsLoaded: true,
      });
    });
  };

  handleOnClear = () => {
    //Clear input, draw object, result list
    this.setState({
      searchString: "",
      searchActive: "",
      searchResults: { featureCollections: [], errors: [] },
    });

    if (this.drawSource) {
      this.drawSource.clear();
    }
    if (this.resultsSource) {
      this.resultsSource.clear();
    }
  };

  handleSearchInput = (event, value, reason) => {
    let searchString = value?.autocompleteEntry || value || "";

    if (searchString !== "") {
      this.setState(
        {
          searchString: searchString,
          searchActive: "input",
        },
        () => {
          if (reason !== "input") {
            this.doSearch();
          }
        }
      );
    } else {
      this.setState({
        searchString: searchString,
      });
    }
  };

  handleOnInputChange = (event, searchString, reason) => {
    this.resultsSource.clear();
    this.setState(
      {
        autoCompleteOpen: searchString.length >= 3,
        loading:
          searchString.length >= 3 && this.state.autocompleteList.length === 0,
        showSearchResults: false,
        searchString: searchString,
      },
      () => {
        if (this.state.searchString.length >= 3) {
          this.updateAutoCompleteList(this.state.searchString);
        } else {
          this.setState({
            autocompleteList: [],
          });
        }
      }
    );
  };

  updateSearchOptions = (searchOptions) => {
    this.setState(searchOptions);
  };

  handleOnSearch = () => {
    this.doSearch();
  };

  handleSearchSettings = (option) => {
    this.setState({
      searchSettings: options,
    });
  };

  handleDrawSource = (source) => {
    this.setState({
      searchActive: "draw",
      drawSource: source,
    });
  };

  handleSearchSources = (sources) => {
    this.setState({
      searchSources: sources,
    });
  };

  getAutoCompleteFetchSettings = () => {
    let fetchSettings = { ...this.searchModel.getSearchOptions() };
    fetchSettings["maxResultsPerDataset"] = 5;
    return fetchSettings;
  };

  flattenAndSortAutoCompleteList = (searchResults) => {
    const resultsPerDataset = searchResults.featureCollections.map(
      (featureCollection) => {
        return featureCollection.value.features.map((feature) => {
          // TODO: We should add another property in admin that'll decide which FIELD (and it should
          // be one (1) field only) should be used for Autocomplete.
          // There's a huge problem with the previous approach (mapping displayFields and using that
          // in Autocomplete) because __there will never be a match in on searchField if the search
          // string consists of values that have been stitched together from multiple fields__!
          const autocompleteEntry =
            feature.properties[featureCollection.source.searchFields[0]];
          // Let's provide a name for each dataset, so it can be displayed nicely to the user.
          const dataset = featureCollection.source.caption;
          const origin = featureCollection.origin;
          return {
            dataset,
            autocompleteEntry,
            origin: origin,
          };
        });
      }
    );
    // Now we have an Array of Arrays, one per dataset. For the Autocomplete component
    // however, we need just one Array, so let's flatten the results:
    const flatAutocompleteArray = resultsPerDataset.reduce(
      (a, b) => a.concat(b),
      []
    );
    return flatAutocompleteArray.sort((a, b) =>
      a.autocompleteEntry.localeCompare(b.autocompleteEntry, "sv", {
        numeric: true,
      })
    );
  };

  updateAutoCompleteList = () => {
    let { searchSources } = this.state;
    let searchResults = { errors: [], featureCollections: [] };
    if (searchSources.length === 0) {
      searchSources = this.searchModel.getSources();
    }

    let fetchOptions = this.getAutoCompleteFetchSettings();
    let active = true;

    (async () => {
      try {
        const promise = this.searchModel.getResults(
          this.state.searchString,
          searchSources, // this is a state variable!
          fetchOptions
        );

        Promise.allSettled([promise, ...this.fetchResultsFromPlugins()]).then(
          (results) => {
            results.forEach((result) => {
              searchResults.featureCollections = searchResults.featureCollections.concat(
                result.value.featureCollections
              );
              searchResults.errors = searchResults.errors.concat(
                result.value.errors
              );
            });

            // It's possible to handle any errors in the UI by checking if Search Model returned any
            searchResults.errors.length > 0 &&
              console.error("Autocomplete error: ", searchResults.errors);

            this.setState({
              autocompleteList: this.prepareAutoCompleteList(searchResults),
            });
          }
        );
      } catch (error) {
        // If we catch an error, display it to the user
        // (preferably in a Snackbar instead of console).
        console.error("Autocomplete error: ", error);

        // Also, set "open" state variable to false, which
        // abort the "loading" state of Autocomplete.
        if (active) {
          this.setState({
            open: false,
          });
        }
      } finally {
        // Regardless if we had an error or not, we're done.
        return () => {
          active = false;
        };
      }
    })();
  };

  fetchResultsFromPlugins = () => {
    const { searchImplementedPlugins, searchString } = this.state;
    if (searchImplementedPlugins && searchImplementedPlugins.length === 0) {
      return [];
    }
    return searchImplementedPlugins.reduce((promises, plugin) => {
      if (plugin.searchInterface.getResults) {
        promises.push(plugin.searchInterface.getResults(searchString));
        return promises;
      }
      return promises;
    }, []);
  };

  hasEnoughCharsForSearch = (searchString) => {
    return searchString.length >= 3;
  };

  async doSearch() {
    // Wrap all calls to Search Model in a try/catch because
    // Search Model may throw Errors which we should handle
    // in the UI Component.
    let { searchString, searchSources } = this.state;
    let searchResults = { errors: [], featureCollections: [] };

    if (searchSources.length === 0) {
      searchSources = this.searchModel.getSources();
    }

    if (!this.hasEnoughCharsForSearch(searchString)) {
      return null;
    }

    try {
      const promise = this.searchModel.getResults(
        searchString,
        searchSources, // this is a state variable!
        this.getSearchResultsFetchSettings()
      );

      Promise.allSettled([promise, ...this.fetchResultsFromPlugins()]).then(
        (results) => {
          results.forEach((result) => {
            searchResults.featureCollections = searchResults.featureCollections.concat(
              result.value.featureCollections
            );
            searchResults.errors = searchResults.errors.concat(
              result.value.errors
            );
          });

          // It's possible to handle any errors in the UI by checking if Search Model returned any
          searchResults.errors.length > 0 &&
            console.error(searchResults.errors);

          this.setState({
            searchResults,
            showSearchResults: true,
            loading: false,
            autoCompleteOpen: false,
          });

          this.addFeaturesToResultsLayer(searchResults.featureCollections);
        }
      );
    } catch (err) {
      console.error("Show a nice error message to user with info:", err);
    }
  }

  addFeaturesToResultsLayer = (featureCollections) => {
    this.resultsSource.clear();

    const features = featureCollections.map((fc) =>
      fc.value.features.map((f) => {
        const geoJsonFeature = new GeoJSON().readFeature(f);
        return geoJsonFeature;
      })
    );

    features.map((f) => this.resultsSource.addFeatures(f));

    //Zoom to fit all features
    const currentExtent = this.resultsSource.getExtent();

    if (currentExtent.map(Number.isFinite).includes(false) === false) {
      this.map.getView().fit(currentExtent, {
        size: this.map.getSize(),
        maxZoom: 7,
      });
    }
  };

  getSearchResultsFetchSettings = () => {
    return this.getUserCustomFetchSettings(this.searchModel.getSearchOptions());
  };

  removeCollectionsWithoutFeatures = (searchResults) => {
    for (let i = searchResults.featureCollections.length - 1; i >= 0; i--) {
      if (searchResults.featureCollections[i].value.features.length === 0) {
        searchResults.featureCollections.splice(i, 1);
      }
    }
    return searchResults;
  };

  prepareAutoCompleteList = (searchResults) => {
    const cleanedResults = this.removeCollectionsWithoutFeatures(searchResults);
    let numSourcesWithResults = cleanedResults.featureCollections.length;
    let numResults = 0;
    cleanedResults.featureCollections.forEach((fc) => {
      numResults += fc.value.features.length;
    });

    let spacesPerSource = Math.floor(numResults / numSourcesWithResults);

    if (numResults <= 7) {
      //All results can be shown
      return this.flattenAndSortAutoCompleteList(cleanedResults);
    } else {
      cleanedResults.featureCollections.forEach((fc) => {
        if (fc.value.features.length > spacesPerSource) {
          fc.value.features.splice(spacesPerSource - 1);
        }
      });
      return this.flattenAndSortAutoCompleteList(cleanedResults);
    }
  };

  getUserCustomFetchSettings = (searchOptionsFromModel) => {
    const {
      activeSpatialFilter,
      matchCase,
      wildcardAtEnd,
      wildcardAtStart,
    } = this.state.searchOptions;
    let customSearchOptions = { ...searchOptionsFromModel };
    customSearchOptions["activeSpatialFilter"] = activeSpatialFilter; // "intersects" or "within"
    customSearchOptions["featuresToFilter"] = this.drawSource.getFeatures();
    customSearchOptions["matchCase"] = matchCase;
    customSearchOptions["wildcardAtStart"] = wildcardAtStart;
    customSearchOptions["wildcardAtEnd"] = wildcardAtEnd;
    return customSearchOptions;
  };

  render() {
    const { classes, target } = this.props;
    const {
      searchString,
      searchActive,
      searchResults,
      autocompleteList,
      autoCompleteOpen,
      showSearchResults,
      loading,
      searchOptions,
    } = this.state;

    return (
      this.state.searchImplementedPluginsLoaded && (
        <>
          <SearchBar
            classes={{
              root: classes.inputRoot,
              input:
                target === "top" ? classes.inputInputWide : classes.inputInput,
            }}
            searchImplementedPlugins={this.state.searchImplementedPlugins}
            updateAutoCompleteList={this.updateAutoCompleteList}
            resultsSource={this.resultsSource}
            searchResults={searchResults}
            handleSearchInput={this.handleSearchInput}
            searchString={searchString}
            searchActive={searchActive}
            handleOnSearch={this.handleOnSearch}
            autoCompleteOpen={autoCompleteOpen}
            showSearchResults={showSearchResults}
            handleOnInputChange={this.handleOnInputChange}
            handleOnClear={this.handleOnClear}
            autocompleteList={autocompleteList}
            doSearch={this.doSearch.bind(this)}
            searchModel={this.searchModel}
            searchOptions={searchOptions}
            updateSearchOptions={this.updateSearchOptions}
            handleSearchSources={this.handleSearchSources}
            loading={loading}
            {...this.props}
          />
        </>
      )
    );
  }
}
export default withStyles(styles)(Search);
