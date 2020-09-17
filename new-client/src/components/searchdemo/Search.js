import React from "react";
import SearchBar from "./SearchBar";

import { withStyles } from "@material-ui/core/styles";
import { options } from "marked";
import Observer from "react-event-observer";

import EditIcon from "@material-ui/icons/Edit";
import RadioButtonUncheckedIcon from "@material-ui/icons/RadioButtonUnchecked";
import SettingsIcon from "@material-ui/icons/Settings";
import MapViewModel from "./MapViewModel";

const styles = (theme) => ({
  inputRoot: {
    width: "100%",
  },
});

const defaultSearchTools = [
  {
    name: "Sök med polygon",
    icon: <EditIcon />,
    type: "Polygon",
    onClickEventName: "spatial-search",
  },
  {
    name: "Sök med radie",
    icon: <RadioButtonUncheckedIcon />,
    type: "Circle",
    onClickEventName: "spatial-search",
  },
  {
    name: "Sökinställningar",
    icon: <SettingsIcon />,
    type: "SETTINGS",
    onClickEventName: "",
  },
];

class Search extends React.PureComponent {
  state = {
    searchImplementedPluginsLoaded: false,
    searchSources: [],
    searchResults: { featureCollections: [], errors: [] },
    autocompleteList: [],
    searchString: "",
    searchActive: "",
    autoCompleteOpen: false,
    loading: false,
    searchOptions: {
      wildcardAtStart: false,
      wildcardAtEnd: true,
      matchCase: false,
      activeSpatialFilter: "within",
    },
  };

  searchTools = [];
  searchImplementedPlugins = [];

  constructor(props) {
    super(props);
    console.log(props, "rpops");
    this.localObserver = Observer();
    this.map = props.map;
    this.searchModel = props.app.appModel.searchModel;
    this.localObserver.subscribe("on-draw-end", (feature) => {
      this.featuresToFilter = [feature];
      this.doSearch();
    });
    this.localObserver.subscribe("on-draw-start", (feature) => {
      this.setState({ searchActive: "draw" });
    });
    this.mapViewModel = new MapViewModel({
      options: this.props.options,
      localObserver: this.localObserver,
      map: this.map,
      app: props.app,
    });
  }

  implementsSearchInterface = (plugin) => {
    let hasGetResultsMethod = plugin.searchInterface.getResults;
    let hasGetFunctionalityMethod = plugin.searchInterface.getFunctionality;
    if (!hasGetResultsMethod || !hasGetFunctionalityMethod) {
      console.warn(
        plugin.type +
          " has flag searchImplemented = true but has not implemented correct methods in plugin to use search"
      );
      return false;
    }
    return true;
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

  getSearchTools = () => {
    const searchToolsFromExternalPlugins = this.searchImplementedPlugins.map(
      (searchImplementedPlugin) => {
        return searchImplementedPlugin.searchInterface.getFunctionality();
      }
    );
    return defaultSearchTools.concat(searchToolsFromExternalPlugins);
  };

  componentDidMount = () => {
    const { app } = this.props;
    app.globalObserver.subscribe("core.appLoaded", () => {
      this.searchImplementedPlugins = this.getSearchImplementedPlugins();
      this.searchTools = this.getSearchTools();
      this.setState({
        searchImplementedPluginsLoaded: true,
      });
    });
  };

  handleOnClear = () => {
    this.setState({
      searchString: "",
      searchActive: "",
      showSearchResults: false,
      searchResults: { featureCollections: [], errors: [] },
    });
    this.featuresToFilter = [];
    this.localObserver.publish("clear-search-results");
  };

  handleSearchInput = (event, value, reason) => {
    let searchString = value?.autocompleteEntry.split(",")[0] || value || "";
    console.log("reason: ", reason);

    if (searchString !== "") {
      this.setState(
        {
          searchString: searchString,
          searchActive: "input",
        },
        () => {
          this.doSearch();
        }
      );
    } else {
      this.setState({
        searchString: searchString,
      });
    }
  };

  handleOnInputChange = (event, searchString, reason) => {
    this.localObserver.publish("clear-search-results");

    this.setState(
      {
        autoCompleteOpen: searchString.length >= 3,
        loading: searchString.length >= 3,
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
    const { searchString } = this.state;
    if (this.hasEnoughCharsForSearch(searchString)) {
      this.doSearch();
    }
  };

  handleSearchSettings = (option) => {
    this.setState({
      searchSettings: options,
    });
  };

  handleSearchSources = (sources) => {
    this.setState({
      searchSources: sources,
    });
  };

  handleSearchBarKeyPress = (event) => {
    if (event.which === 13 || event.keyCode === 13) {
      this.handleOnSearch();
    }
  };

  getAutoCompleteFetchSettings = () => {
    let fetchSettings = { ...this.searchModel.getSearchOptions() };
    console.log(fetchSettings, "fetchSettings");
    fetchSettings["maxResultsPerDataset"] = 7;
    return fetchSettings;
  };

  getMatchedSearchFields = (featureCollection, feature) => {
    return featureCollection.source.searchFields.filter((searchField) => {
      return RegExp(`^${this.state.searchString}\\W*`, "i").test(
        feature.properties[searchField]
      );
    });
  };

  getAutoCompleteEntryFromMatchedSearchFields = (feature) => {
    let autocompleteEntry = "";
    feature.matchedSearchFields.map((sf, index) => {
      if (index === feature.matchedSearchFields.length - 1) {
        return (autocompleteEntry = autocompleteEntry.concat(
          feature.properties[sf]
        ));
      } else {
        return (autocompleteEntry = autocompleteEntry.concat(
          `${feature.properties[sf]}, `
        ));
      }
    });
    return autocompleteEntry;
  };

  flattenAndSortAutoCompleteList = (searchResults) => {
    const resultsPerDataset = searchResults.featureCollections.map(
      (featureCollection) => {
        return featureCollection.value.features
          .filter((feature) => {
            let matchedSearchFields = this.getMatchedSearchFields(
              featureCollection,
              feature
            );
            feature.matchedSearchFields = matchedSearchFields;

            return matchedSearchFields.length > 0;
          })
          .map((feature) => {
            const dataset = featureCollection.source.caption;
            const origin = featureCollection.origin;
            const autocompleteEntry = this.getAutoCompleteEntryFromMatchedSearchFields(
              feature
            );
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
    console.log(this.state.searchString, "this.state.searchString");
    console.log(searchSources, "searchSources");
    console.log(fetchOptions, "fetchOptions");
    const promise = this.searchModel.getResults(
      this.state.searchString,
      searchSources,
      fetchOptions
    );

    return Promise.allSettled([promise, ...this.fetchResultsFromPlugins()])
      .then((results) => {
        results = results.filter((result) => result.status !== "rejected");
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
    this.setState({ loading: true });
    let fetchOptions = this.getSearchResultsFetchSettings();
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

    this.localObserver.publish("add-features-to-results-layer", features);
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
      loading: false,
    });
  };

  fetchResultsFromPlugins = () => {
    const { searchString } = this.state;
    if (
      this.searchImplementedPlugins &&
      this.searchImplementedPlugins.length === 0
    ) {
      return [];
    }
    return this.searchImplementedPlugins.reduce((promises, plugin) => {
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
    console.log("searchREsults: ", searchResults);
    let maxSlots = 7;
    let numSourcesWithResults = searchResults.featureCollections.length;
    console.log("numSourcesWithResults: ", numSourcesWithResults);
    let numResults = 0;
    searchResults.featureCollections.forEach((fc) => {
      numResults += fc.value.features.length;
    });
    console.log("numResults: ", numResults);

    let spacesPerSource = Math.max(
      1,
      Math.min(
        Math.floor(numResults / numSourcesWithResults),
        Math.floor(maxSlots / numSourcesWithResults)
      )
    );

    if (numResults <= maxSlots) {
      //All results can be shown
      return this.flattenAndSortAutoCompleteList(searchResults);
    } else {
      searchResults.featureCollections.forEach((fc) => {
        console.log("fc.value.features", fc.value.features);
        if (fc.value.features.length > spacesPerSource) {
          fc = fc.value.features.splice(spacesPerSource);
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
    customSearchOptions["featuresToFilter"] = this.featuresToFilter || [];
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
      searchSources,
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
            localObserver={this.localObserver}
            searchImplementedPlugins={this.searchImplementedPlugins}
            updateAutoCompleteList={this.updateAutoCompleteList}
            searchTools={this.searchTools}
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
            searchSources={searchSources}
            handleSearchBarKeyPress={this.handleSearchBarKeyPress}
            {...this.props}
          />
        </>
      )
    );
  }
}
export default withStyles(styles)(Search);
