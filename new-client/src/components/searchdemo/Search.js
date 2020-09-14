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

var fill = new Fill({
  color: "rgba(255,255,255,0.4)",
});
var stroke = new Stroke({
  color: "#3399CC",
  width: 1.25,
});
var defaultStyles = [
  new Style({
    image: new Circle({
      fill: fill,
      stroke: stroke,
      radius: 5,
    }),
    fill: fill,
    stroke: stroke,
  }),
];

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
    this.resultSource = new VectorSource({ wrapX: false });
    this.resultsLayer = new VectorLayer({
      source: this.resultSource,
      style: props.options.showInMapOnSearch ? defaultStyles : null,
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
    if (this.resultSource) {
      this.resultSource.clear();
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
    this.resultSource.clear();
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

  getMergeResultsFromAllSources = (results) => {
    return results.reduce(
      (searchResults, result) => {
        searchResults.featureCollections = searchResults.featureCollections.concat(
          result.value.featureCollections
        );
        searchResults.errors = searchResults.errors.concat(result.value.errors);
        return searchResults;
      },
      { errors: [], featureCollections: [] }
    );
  };

  fetchResultFromSearchModel = async (fetchOptions) => {
    let { searchSources } = this.state;

    if (searchSources.length === 0) {
      searchSources = this.searchModel.getSources();
    }

    let active = true;

    const promise = this.searchModel.getResults(
      this.state.searchString,
      searchSources,
      fetchOptions
    );

    return Promise.allSettled([promise, ...this.fetchResultsFromPlugins()])
      .then((results) => {
        results = this.removeCollectionsWithoutFeatures(results);
        let searchResults = this.getMergeResultsFromAllSources(results);
        // It's possible to handle any errors in the UI by checking if Search Model returned any
        searchResults.errors.length > 0 &&
          console.error("Autocomplete error: ", searchResults.errors);
        return searchResults;
      })
      .catch((error) => {
        console.error("Autocomplete error: ", error);

        // Also, set "open" state variable to false, which
        // abort the "loading" state of Autocomplete.
        if (active) {
          this.setState({
            open: false,
          });
        }
      });
  };

  async doSearch() {
    const { options } = this.props;
    let fetchOptions = this.getAutoCompleteFetchSettings();
    let searchResults = await this.fetchResultFromSearchModel(fetchOptions);
    this.setState({
      searchResults,
      showSearchResults: true,
      loading: false,
      autoCompleteOpen: false,
    });

    let features = this.extractFeatureWithFromFeatureCollections(
      searchResults.featureCollections
    );

    features = this.filterFeaturesWithGeometry(features);

    this.addFeaturesToResultsLayer(features);
  }

  filterFeaturesWithGeometry = (features) => {
    return features.filter((feature) => {
      return feature.geometry != null;
    });
  };

  extractFeatureWithFromFeatureCollections = (featureCollections) => {
    return featureCollections
      .map((fc) => {
        return fc.value.features;
      })
      .flat();
  };

  updateAutoCompleteList = async () => {
    let fetchOptions = this.getAutoCompleteFetchSettings();
    let autoCompleteResult = await this.fetchResultFromSearchModel(
      fetchOptions
    );
    this.setState({
      autocompleteList: this.prepareAutoCompleteList(autoCompleteResult),
    });
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

  fitMapToSearchResult = () => {
    //Zoom to fit all features
    const currentExtent = this.resultSource.getExtent();

    if (currentExtent.map(Number.isFinite).includes(false) === false) {
      this.map.getView().fit(currentExtent, {
        size: this.map.getSize(),
        maxZoom: 7,
      });
    }
  };

  addFeaturesToResultsLayer = (features) => {
    const { options } = this.props;
    this.resultSource.clear();
    this.resultSource.addFeatures(
      features.map((f) => {
        return new GeoJSON().readFeature(f);
      })
    );

    if (options.showInMapOnSearch) {
      this.fitMapToSearchResult();
    }
  };

  getSearchResultsFetchSettings = () => {
    return this.getUserCustomFetchSettings(this.searchModel.getSearchOptions());
  };

  removeCollectionsWithoutFeatures = (results) => {
    return results.map((res) => {
      var featureCollections = res.value.featureCollections.filter(
        (featureCollection) => {
          return featureCollection.value.features.length > 0;
        }
      );
      res.value.featureCollections = featureCollections;
      return res;
    });
  };

  prepareAutoCompleteList = (searchResults) => {
    let numSourcesWithResults = searchResults.featureCollections.length;
    let numResults = 0;
    searchResults.featureCollections.forEach((fc) => {
      numResults += fc.value.features.length;
    });

    let spacesPerSource = Math.floor(numResults / numSourcesWithResults);

    if (numResults <= 7) {
      //All results can be shown
      return this.flattenAndSortAutoCompleteList(searchResults);
    } else {
      searchResults.featureCollections.forEach((fc) => {
        if (fc.value.features.length > spacesPerSource) {
          fc.value.features.splice(spacesPerSource - 1);
        }
      });
      return this.flattenAndSortAutoCompleteList(searchResults);
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
            resultSource={this.resultSource}
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
