import React from "react";
import SearchBar from "./SearchBar";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import Observer from "react-event-observer";
import EditIcon from "@material-ui/icons/Edit";
import Crop54Icon from "@material-ui/icons/Crop54";
import TouchAppIcon from "@material-ui/icons/TouchApp";
import RadioButtonUncheckedIcon from "@material-ui/icons/RadioButtonUnchecked";
import SettingsIcon from "@material-ui/icons/Settings";
import MapViewModel from "./MapViewModel";
import KmlExport from "./utils/KmlExport";
import XLSXExport from "./utils/XLSXExport";
import { encodeCommas, decodeCommas } from "../../utils/StringCommaCoder";
import LocalStorageHelper from "../../utils/LocalStorageHelper";

const styles = () => ({
  inputRoot: {
    width: "100%",
  },
});

class Search extends React.PureComponent {
  defaultSearchOptions = {
    enableLabelOnHighlight: true,
    wildcardAtStart: false,
    wildcardAtEnd: true,
    matchCase: false,
    activeSpatialFilter: "intersects",
    maxResultsPerDataset: !isNaN(this.props.options.maxResultsPerDataset)
      ? this.props.options.maxResultsPerDataset
      : 100,
  };

  state = {
    searchImplementedPluginsLoaded: false,
    searchSources: [],
    searchResults: { featureCollections: [], errors: [] },
    autocompleteList: [],
    searchString: "",
    searchFromAutoComplete: false,
    searchActive: "",
    autoCompleteOpen: false,
    loading: false,
    searchOptions: LocalStorageHelper.get(
      "searchOptions",
      this.defaultSearchOptions
    ),
    failedWFSFetchMessage: "",
    resultPanelCollapsed: false,
  };

  // Used for setTimeout/clearTimeout, in order to delay update of autocomplete when user is typing
  timer = null;

  // Amount of time before autocomplete is updated
  delayBeforeAutoSearch =
    isNaN(this.props.options.delayBeforeAutoSearch) === false
      ? this.props.options.delayBeforeAutoSearch
      : 500;

  searchImplementedPlugins = [];
  featuresToFilter = [];
  localObserver = Observer();

  snackbarKey = null;

  defaultSearchTools = [
    {
      name: "Sök med polygon",
      icon: <EditIcon />,
      type: "Polygon",
      enabled: this.props.options.enablePolygonSearch ?? true,
      toolTipTitle:
        "Genomför en sökning i ett område genom att rita en polygon.",
      onClickEventName: "search.spatialSearchActivated",
    },
    {
      name: "Sök med radie",
      icon: <RadioButtonUncheckedIcon />,
      type: "Circle",
      enabled: this.props.options.enableRadiusSearch ?? true,
      toolTipTitle: "Genomför en sökning i ett område genom att rita en cirkel",
      onClickEventName: "search.spatialSearchActivated",
    },
    {
      name: "Sök med objekt",
      icon: <TouchAppIcon />,
      type: "Select",
      enabled: this.props.options.enableSelectSearch ?? true,
      toolTipTitle:
        "Genomför en sökning genom att välja en eller flera områden i kartan.",
      onClickEventName: "search.spatialSearchActivated",
    },
    {
      name: "Sök inom vyn",
      icon: <Crop54Icon />,
      type: "Extent",
      enabled: this.props.options.enableExtentSearch ?? true,
      toolTipTitle: "Genomför en sökning i hela det område som kartan visar.",
      onClickEventName: "search.spatialSearchActivated",
    },
    {
      name: "Sökinställningar",
      icon: <SettingsIcon />,
      type: "SETTINGS",
      toolTipTitle: "Ändra sökinställningarna.",
      onClickEventName: "",
    },
  ];

  constructor(props) {
    super(props);
    this.map = props.map;
    this.searchModel = props.app.appModel.searchModel;
    this.globalObserver = props.app.globalObserver;
    this.initMapViewModel();
    this.initExportHandlers();
    this.bindSubscriptions();
  }

  initMapViewModel = () => {
    const { app } = this.props;
    this.mapViewModel = new MapViewModel({
      options: { ...this.props.options, ...this.state.searchOptions }, // Init the MapViewModel using merged options from both admin ("options")and user's setting ("this.state.options")
      localObserver: this.localObserver,
      map: this.map,
      app: app,
    });
  };

  initExportHandlers = () => {
    this.kmlExport = new KmlExport({
      options: this.props.options,
      localObserver: this.localObserver,
      map: this.map,
    });
    this.XLSXExport = new XLSXExport({
      options: this.props.options,
      localObserver: this.localObserver,
    });
  };

  resetFeaturesToFilter = () => {
    this.featuresToFilter = [];
  };

  setFeaturesToFilter = (arrayOfFeatures) => {
    this.featuresToFilter = arrayOfFeatures;
  };

  bindSubscriptions = () => {
    this.localObserver.subscribe("on-draw-start", (type) => {
      if (type === "Circle") {
        this.snackbarKey = this.props.enqueueSnackbar(
          "Tryck i kartan där du vill ha centrumpunkten, dra sedan utåt och släpp.",
          {
            variant: "information",
            anchorOrigin: { vertical: "bottom", horizontal: "center" },
          }
        );
      } else if (type === "Polygon") {
        this.snackbarKey = this.props.enqueueSnackbar(
          "Tryck en gång i kartan för varje nod i polygonen. Genomför sökningen genom att trycka på den sista noden en gång till.",
          {
            variant: "information",
            anchorOrigin: { vertical: "bottom", horizontal: "center" },
          }
        );
      }
      this.setState({ searchActive: "draw" });
    });
    this.localObserver.subscribe("on-draw-end", (feature) => {
      this.doFeaturesSearch([feature]);
    });
    this.localObserver.subscribe("on-select-search-start", () => {
      this.snackbarKey = this.props.enqueueSnackbar(
        "Tryck på den yta i kartan där du vill genomföra en sökning. Håll in CTRL för att välja flera ytor.",
        {
          variant: "information",
          anchorOrigin: { vertical: "bottom", horizontal: "center" },
        }
      );

      this.setState({ searchActive: "selectSearch" });
    });
    this.localObserver.subscribe("on-search-selection-done", (features) => {
      this.doFeaturesSearch(features);
    });
    this.localObserver.subscribe("search-within-extent", (features) => {
      this.setState({ searchActive: "extentSearch" });
      this.doFeaturesSearch(features);
    });
    this.localObserver.subscribe("minimizeSearchResultList", () => {
      this.setState({ resultPanelCollapsed: false });
    });
    this.localObserver.subscribe("extent-search-failed", () => {
      this.snackbarKey = this.props.enqueueSnackbar(
        "Ett problem uppstod vid sökning i området. Kontakta systemadministratören.",
        {
          variant: "warning",
          anchorOrigin: { vertical: "top", horizontal: "center" },
        }
      );
    });
  };

  doFeaturesSearch = (features) => {
    this.props.closeSnackbar(this.snackbarKey);
    this.setFeaturesToFilter(features);
    this.doSearch();
  };

  getPluginsConfToUseSearchInterface = () => {
    const { app } = this.props;
    return Object.values(app.appModel.plugins).filter((plugin) => {
      return (
        plugin.options.searchImplemented &&
        plugin.searchInterface.getSearchMethods
      );
    });
  };

  tryBindSearchMethods = (plugins) => {
    return plugins.map((plugin) => {
      return plugin.searchInterface.getSearchMethods.then((methods) => {
        plugin.searchInterface.getFunctionality = methods?.getFunctionality;
        plugin.searchInterface.getResults = methods?.getResults;
        return plugin;
      });
    });
  };

  pluginsHavingCorrectSearchMethods = (plugins) => {
    return plugins.filter((plugin) => {
      const getResults = plugin.searchInterface.getResults;
      const getFunctionality = plugin.searchInterface.getFunctionality;
      if (!getResults || !getFunctionality) {
        this.displayPluginMissingCrucialMethodsWarning(plugin);
      }
      return getResults && getFunctionality;
    });
  };

  displayPluginMissingCrucialMethodsWarning = (plugin) => {
    console.warn(
      `${
        plugin.type ?? "<Plugin type missing>"
      } is marked as a search-plugin, but is missing the getResults() and/or getFunctionality() method(s) in it's searchInterface.

      Because of this, the search component will not make use of this plugin. 
      
      If you intend to use this plugin as a search-plugin, make sure to implement both methods. 
      If you do not intend to use this plugin within the search component, please update plugin-config so that searchImplemented = false.`
    );
  };

  //For a plugin to use the searchInterface, following must be met
  //Must have option searchImplemented = true in tool-config
  //Must "inject" a method called getSearchMethods returning a promise on the object plugin.searchInterface
  //The object searchInterface is put onto the plugin upon loading in App.js
  //Promise must be resolved into object with two methods getResults and getFunctionality

  getSearchImplementedPlugins = () => {
    const pluginsConfToUseSearchInterface =
      this.getPluginsConfToUseSearchInterface();
    const searchBoundPlugins = this.tryBindSearchMethods(
      pluginsConfToUseSearchInterface
    );
    return Promise.all(searchBoundPlugins).then((plugins) => {
      return this.pluginsHavingCorrectSearchMethods(plugins);
    });
  };

  getExternalSearchTools = (searchImplementedSearchTools) => {
    // TODO (To discuss)
    // We demand that getFunctionality is implemented, but we do not demand that
    // the method returns a "correct" object. If the method return a null-ish
    // value we simply discard the extra functionality. Maybe we shouldn't demand that
    // getFunctionality is implemented?
    return searchImplementedSearchTools
      .filter((searchImplementedPlugin) => {
        return searchImplementedPlugin.searchInterface.getFunctionality();
      })
      .map((toolWithFunctionality) => {
        return toolWithFunctionality.searchInterface.getFunctionality();
      });
  };

  getSearchTools = (searchImplementedSearchTools) => {
    return this.defaultSearchTools.concat(
      this.getExternalSearchTools(searchImplementedSearchTools)
    );
  };

  componentDidMount = () => {
    this.globalObserver.subscribe("core.appLoaded", () => {
      this.getSearchImplementedPlugins().then((searchImplementedPlugins) => {
        this.setState(
          {
            searchImplementedPluginsLoaded: true,
            searchImplementedPlugins: searchImplementedPlugins,
            searchTools: this.getSearchTools(searchImplementedPlugins),
          },
          () => {
            this.handlePotentialUrlQuerySearch();
          }
        );
      });
    });
  };

  getSourcesByIds = (sourceIds) => {
    return this.searchModel
      .getSources()
      .filter((source) => sourceIds.indexOf(source.id) > -1);
  };

  handlePotentialUrlQuerySearch = () => {
    const { appModel } = this.props.app;
    // Grab the (already decoded) URL param values
    const q = appModel.config.urlParams.get("q")?.trim(); // Use of "?." will return either a String or undefined
    const s = appModel.config.urlParams.get("s")?.trim(); // (As opposed to null which would be the return value of get() otherwise!).

    // Check so that we have a searchString in the url (q)
    if (q !== undefined && q.length > 0) {
      // Initializing sources to an empty array
      // (The model will search in all sources if searchSources is set to [])
      let sources = [];
      // If source parameter is set in url (s)
      // Get the sources corresponding to the ids
      if (s !== undefined && s.length > 0) {
        const sourceIds = s.split(",");
        sources = this.getSourcesByIds(sourceIds);
      }
      // Update state according to searchString and sources from url
      // and do a search.
      this.setState({ searchString: q, searchSources: sources }, () => {
        this.doSearch();
      });
    }
  };

  handleOnClear = () => {
    this.setState({
      searchString: "",
      searchActive: "",
      showSearchResults: false,
      searchResults: { featureCollections: [], errors: [] },
      failedWFSFetchMessage: "",
      resultPanelCollapsed: false,
      loading: false,
    });
    this.resetFeaturesToFilter();
    this.localObserver.publish("clearMapView");
  };

  handleSearchInput = (event, value, reason) => {
    let searchString = value?.autocompleteEntry || value || "";

    if (searchString !== "") {
      this.setState(
        {
          searchString: searchString,
          searchFromAutoComplete: true,
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

  isUserInput = (searchString, reason) => {
    // Reason equals "reset" when input is changed programmatically
    // This catches user click on clear (searchString === 0)
    return (
      (searchString.length === 0 && reason === "reset") || reason === "input"
    );
  };

  handleOnAutocompleteInputChange = (event, searchString, reason) => {
    if (this.isUserInput(searchString, reason)) {
      clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        this.localObserver.publish("clearMapView");
        this.setState(
          {
            autoCompleteOpen: searchString.length >= 3,
            autocompleteList: [],
            loading: searchString.length >= 3,
            showSearchResults: false,
            searchString: searchString,
            resultPanelCollapsed: false,
          },
          () => {
            if (this.state.searchString.length >= 3) {
              this.updateAutocompleteList(this.state.searchString);
            } else {
              this.setState({
                autocompleteList: [],
              });
            }
          }
        );
      }, this.delayBeforeAutoSearch);

      // Announce the input change, so other plugins can be notified
      this.globalObserver.publish("search.searchPhraseChanged", searchString);
    }
  };

  updateSearchOptions = (searchOptions) => {
    // Ensure that the latest search options are in state
    this.setState({ searchOptions });

    // We need to re-initiate the FeatureStyle only if some specific
    // settings have changed (those that effect the style that renders
    // result features to the OL searchResults source).
    const isStyleRefreshNeeded =
      searchOptions.enableLabelOnHighlight !==
      this.state.searchOptions.enableLabelOnHighlight;

    // Refresh the Feature Style, if needed
    isStyleRefreshNeeded &&
      this.mapViewModel.refreshFeatureStyle({
        enableLabelOnHighlight: searchOptions.enableLabelOnHighlight,
      });

    // Always save the current settings to local storage, so it can be
    // retrieved on app reload.
    LocalStorageHelper.set("searchOptions", searchOptions);
  };

  handleOnClickOrKeyboardSearch = () => {
    if (this.hasEnoughCharsForSearch()) {
      this.setState({ searchFromAutoComplete: false }, () => {
        // Get rid of the on-screen keyboard on mobile devices
        document.activeElement.blur();
        this.doSearch();
      });
    }
  };

  setSearchSources = (sources) => {
    this.setState({
      searchSources: sources,
    });
  };

  handleSearchBarKeyPress = (event) => {
    if (event.which === 13 || event.keyCode === 13) {
      if (event.target.id === "searchInputField") {
        this.handleOnClickOrKeyboardSearch();
      }
    }
  };

  getAutoCompleteFetchSettings = () => {
    const { options } = this.props;
    let fetchSettings = { ...this.searchModel.getSearchOptions() }; //Getting default-options when fetching auto
    fetchSettings = {
      ...fetchSettings,
      wildcardAtStart: options.autocompleteWildcardAtStart || false,
      getPossibleCombinations: true,
      initiator: "autocomplete",
    };
    return fetchSettings;
  };

  getArrayWithSearchWords = (searchString) => {
    let tempStringArray = this.splitAndTrimOnCommas(searchString);
    return tempStringArray.join(" ").split(" ");
  };

  splitAndTrimOnCommas = (searchString) => {
    return searchString.split(",").map((string) => {
      return string.trim();
    });
  };

  escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
  };

  sortSearchFieldsOnFeature = (searchFields, feature, wordsInTextField) => {
    const matchedSearchFields = [];

    // We loop over each word in the input field first to ensure
    // that we don't mess upp the order of the displayFields...
    wordsInTextField.forEach((word) => {
      // then we get the searchFields that has not been matched yet
      searchFields
        .filter((sf) => !matchedSearchFields.includes(sf))
        // and loop over these...
        .forEach((sf) => {
          // to find searchFields matching the current word...
          const searchFieldMatch = RegExp(
            `^${this.escapeRegExp(word)}\\W*`,
            "i"
          ).test(feature.properties[sf] || "");
          // If we find a match, and the matched searchField
          // returns a feature prop which is not undefined...
          if (feature.properties[sf]) {
            // we add the searchField to the array of matched
            // searchFields.
            if (searchFieldMatch) {
              matchedSearchFields.push(sf);
            }
          }
        });
    });

    // The function should return ALL searchField (no matter if
    // they have been matched or not. Therefore we get the searchFields
    // that have not been matched)...
    const unMatchedSearchFields = searchFields.filter(
      (sf) => !matchedSearchFields.includes(sf) && feature.properties[sf]
    );
    // And concatenate the matched searchFields with the unMatched searchFields.
    return matchedSearchFields.concat(unMatchedSearchFields);
  };

  getSortedAutocompleteEntry = (feature) => {
    let autocompleteEntry = "";
    feature.searchFieldOrder.map((sf, index) => {
      const featureProperty = feature.properties[sf];
      const propertyAsString =
        typeof featureProperty === "string"
          ? featureProperty
          : featureProperty.toString();
      if (index === feature.searchFieldOrder.length - 1) {
        return (autocompleteEntry = autocompleteEntry.concat(
          encodeCommas(propertyAsString)
        ));
      } else {
        return (autocompleteEntry = autocompleteEntry.concat(
          `${encodeCommas(propertyAsString)}, `
        ));
      }
    });
    return autocompleteEntry;
  };

  getAutocompleteDataset = (featureCollection) => {
    return featureCollection.value.features.map((feature) => {
      const dataset = featureCollection.source.caption;
      const origin = featureCollection.origin;
      const autocompleteEntry = this.getSortedAutocompleteEntry(feature);
      return {
        dataset,
        autocompleteEntry,
        origin: origin,
      };
    });
  };

  sortSearchFieldsOnFeatures = (featureCollection, wordsInTextField) => {
    featureCollection.value.features.forEach((feature) => {
      feature.searchFieldOrder = this.sortSearchFieldsOnFeature(
        featureCollection.source.searchFields,
        feature,
        wordsInTextField
      );
    });
  };

  flattenAndSortAutoCompleteList = (searchResults) => {
    let wordsInTextField = this.getArrayWithSearchWords(
      this.state.searchString
    );

    const resultsPerDataset = searchResults.featureCollections.map(
      (featureCollection) => {
        this.sortSearchFieldsOnFeatures(featureCollection, wordsInTextField);
        return this.getAutocompleteDataset(featureCollection);
      }
    );

    // Now we have an Array of Arrays, one per dataset. For the Autocomplete component
    // however, we need just one Array, so let's flatten the results:

    return this.sortAutocompleteList(resultsPerDataset.flat());
  };

  sortAutocompleteList = (flatAutocompleteArray) => {
    return flatAutocompleteArray.sort((a, b) =>
      decodeCommas(a.autocompleteEntry).localeCompare(
        decodeCommas(b.autocompleteEntry),
        "sv"
      )
    );
  };

  getMergeResultsFromAllSources = (results) => {
    return results.reduce(
      (searchResults, result) => {
        searchResults.featureCollections =
          searchResults.featureCollections.concat(
            result.value.featureCollections
          );
        searchResults.errors = searchResults.errors.concat(result.value.errors);
        return searchResults;
      },
      { errors: [], featureCollections: [] }
    );
  };

  fetchResultFromSearchModel = async (fetchOptions) => {
    // Check if the searchString is encapsuled with quotation marks
    const searchStringIsEncapsuled = this.searchStringEncapsuled();

    // If the searchString is encapsuled with quotation marks (meaning that the user is
    // searching for an exacts phrase, we want to disable potential wildcards in the
    // fetchOptions.
    if (searchStringIsEncapsuled) {
      fetchOptions = {
        ...fetchOptions,
        wildcardAtStart: false,
        wildcardAtEnd: false,
      };
    }

    // Potential quotation marks in the searchString must be removed before
    // we perform the search.
    const searchString = this.getCleanedSearchString();

    let { searchSources } = this.state;

    if (searchSources.length === 0) {
      searchSources = this.searchModel.getSources();
    }

    let active = true;
    const promise = this.searchModel.getResults(
      searchString,
      searchSources,
      fetchOptions
    );

    return Promise.allSettled([
      promise,
      ...this.fetchResultsFromPlugins(fetchOptions),
    ])
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

  // Returns true if the searchString is encapsuled in quotation marks.
  searchStringEncapsuled = () => {
    const { searchString } = this.state;
    return searchString.startsWith('"') && searchString.endsWith('"');
  };

  // Removes potential quotation marks from the searchString
  getCleanedSearchString = () => {
    const { searchString } = this.state;
    return searchString.replace(/"/g, "");
  };

  getPotentialWFSErrorMessage = (searchResults) => {
    return searchResults.errors.length === 0
      ? ``
      : `OBS: Kunde inte hämta data från: `.concat(
          searchResults.errors
            .map((error, index) => {
              return index === searchResults.errors.length - 1
                ? error.source.caption
                : `${error.source.caption}, `;
            })
            .join("")
        );
  };

  async doSearch() {
    this.setState({ loading: true });
    const fetchOptions = this.getSearchResultsFetchSettings();
    const searchResults = await this.fetchResultFromSearchModel(fetchOptions);
    const failedWFSFetchMessage =
      this.getPotentialWFSErrorMessage(searchResults);

    this.setState({
      searchResults,
      showSearchResults: true,
      loading: false,
      autoCompleteOpen: false,
      failedWFSFetchMessage,
      resultPanelCollapsed: false,
    });

    let features = this.extractFeaturesFromFeatureCollections(
      searchResults.featureCollections
    );

    features = this.filterFeaturesWithGeometry(features);

    // If we got more than 1 result, publish event below
    if (features.length !== 1) {
      this.localObserver.publish("map.addFeaturesToResultsLayer", features);
    }
    // If we get a single search-result, we add it to the map in the searchResultList-component instead,
    // unless clean mode is true. In that case, there's another event we want to publish.
    else if (this.props.app.appModel.config.mapConfig.map.clean === true) {
      const feature = features[0];
      const featureTitle = this.getFeatureTitle(
        feature,
        searchResults.featureCollections[0].source
      );

      this.localObserver.publish(
        "map.addAndHighlightFeatureInSearchResultLayer",
        {
          feature,
          featureTitle,
        }
      );
    }
  }

  // FIXME: Obtain featureTitle directly in extractFeaturesFromFeatureCollections,
  // set title as property on feature, and remove this.
  getFeatureTitle = (feature, source) => {
    if (feature.featureTitle) {
      return feature.featureTitle;
    }

    return source.displayFields.reduce((featureTitleString, df) => {
      let displayField = feature.properties[df];
      if (Array.isArray(displayField)) {
        displayField = displayField.join(", ");
      }

      if (displayField) {
        if (featureTitleString.length > 0) {
          featureTitleString = featureTitleString.concat(` | ${displayField}`);
        } else {
          featureTitleString = displayField.toString();
        }
      }

      feature.featureTitle = featureTitleString;
      return featureTitleString;
    }, "");
  };

  filterFeaturesWithGeometry = (features) => {
    return features.filter((feature) => {
      return feature.geometry != null;
    });
  };

  extractFeaturesFromFeatureCollections = (featureCollections) => {
    return featureCollections
      .map((fc) => {
        return fc.value.features;
      })
      .flat();
  };

  getNumResults = (searchResults) => {
    let numResults = 0;
    searchResults.featureCollections.forEach((fc) => {
      numResults += fc.value.features.length;
    });
    return numResults;
  };

  updateAutocompleteList = async () => {
    let fetchOptions = this.getAutoCompleteFetchSettings();
    let autoCompleteResult = await this.fetchResultFromSearchModel(
      fetchOptions
    );

    this.setState({
      autocompleteList: this.prepareAutocompleteList(autoCompleteResult),
      loading: false,
    });
  };

  anySearchImplementedPlugins = () => {
    return (
      this.state.searchImplementedPlugins &&
      this.state.searchImplementedPlugins.length === 0
    );
  };

  fetchResultsFromPlugins = (fetchOptions) => {
    const { searchString } = this.state;
    if (this.anySearchImplementedPlugins()) {
      return [];
    }
    return this.state.searchImplementedPlugins.reduce((promises, plugin) => {
      if (plugin.searchInterface.getResults) {
        //Had to make a deep clone to not directly manipulate the reference from plugin
        promises.push(
          plugin.searchInterface
            .getResults(searchString, fetchOptions)
            .then((res) => {
              return {
                errors: res.errors,
                featureCollections: res.featureCollections,
              };
            })
        );
        return promises;
      }
      return promises;
    }, []);
  };

  hasEnoughCharsForSearch = () => {
    const { searchString } = this.state;
    return searchString.length >= 3;
  };

  getSearchResultsFetchSettings = () => {
    return {
      ...this.getUserCustomFetchSettings(this.searchModel.getSearchOptions()),
      initiator: "search",
    };
  };

  removeCollectionsWithoutFeatures = (results) => {
    return results.map((res) => {
      let featureCollections = res.value.featureCollections.filter(
        (featureCollection) => {
          return featureCollection.value.features.length > 0;
        }
      );
      res.value.featureCollections = featureCollections;
      return res;
    });
  };

  #sortAndShortenSearchResults = (featureCollections, maxSlots) => {
    featureCollections.sort((a, b) => {
      const sourceNameA = a.source.caption.toUpperCase();
      const sourceNameB = b.source.caption.toUpperCase();
      return sourceNameA.localeCompare(sourceNameB, "sv");
    });
    return featureCollections.slice(0, maxSlots);
  };

  prepareAutocompleteList = (searchResults) => {
    let maxSlots = 7;
    let numSourcesWithResults = searchResults.featureCollections.length;

    if (numSourcesWithResults > maxSlots) {
      searchResults.featureCollections = searchResults.featureCollections.slice(
        0,
        maxSlots
      );
      // searchResults.featureCollections = this.#sortAndShortenSearchResults(
      //   searchResults.featureCollections,
      //   maxSlots
      // );
    }

    let numResults = 0;
    searchResults.featureCollections.forEach((fc) => {
      numResults += fc.value.features.length;
    });

    let spacesPerSource = Math.max(
      1,
      Math.min(
        Math.floor(numResults / numSourcesWithResults),
        Math.floor(maxSlots / numSourcesWithResults)
      )
    );

    const autoCompleteList = this.flattenAndSortAutoCompleteList(searchResults);

    if (numResults > maxSlots) {
      // The list must be shortened before we return
      return this.shortenAutoCompleteList(autoCompleteList, spacesPerSource);
    }
    return autoCompleteList;
  };

  shortenAutoCompleteList = (autoCompleteList, spacesPerSource) => {
    let shortenedAutoComplete = [];

    const groupedAutoComplete = this.groupObjArrayByProp(
      autoCompleteList,
      "dataset"
    );

    for (const group in groupedAutoComplete) {
      shortenedAutoComplete = [
        ...shortenedAutoComplete,
        ...groupedAutoComplete[group].slice(0, spacesPerSource),
      ];
    }
    return shortenedAutoComplete;
  };

  groupObjArrayByProp = (array, property) => {
    return array.reduce((grouped, obj) => {
      if (!grouped[obj[property]]) {
        grouped[obj[property]] = [];
      }
      grouped[obj[property]].push(obj);
      return grouped;
    }, {});
  };

  getUserCustomFetchSettings = (searchOptionsFromModel) => {
    const {
      activeSpatialFilter,
      matchCase,
      wildcardAtEnd,
      wildcardAtStart,
      maxResultsPerDataset,
    } = this.state.searchOptions;
    return {
      ...searchOptionsFromModel,
      activeSpatialFilter: activeSpatialFilter,
      getPossibleCombinations: this.state.searchFromAutoComplete ? false : true,
      featuresToFilter: this.featuresToFilter || [],
      matchCase: matchCase,
      wildcardAtStart: wildcardAtStart,
      wildcardAtEnd: wildcardAtEnd,
      maxResultsPerDataset: maxResultsPerDataset,
    };
  };

  toggleCollapseSearchResults = () => {
    this.setState({ resultPanelCollapsed: !this.state.resultPanelCollapsed });
  };

  render() {
    const { classes } = this.props;
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
      searchTools,
      failedWFSFetchMessage,
      resultPanelCollapsed,
    } = this.state;

    return (
      this.state.searchImplementedPluginsLoaded &&
      this.props.app.appModel.config.mapConfig.map.clean === false && (
        <SearchBar
          classes={{
            root: classes.inputRoot,
          }}
          escapeRegExp={this.escapeRegExp}
          localObserver={this.localObserver}
          searchTools={searchTools}
          searchResults={searchResults}
          handleSearchInput={this.handleSearchInput}
          searchString={searchString}
          searchActive={searchActive}
          handleOnClickOrKeyboardSearch={this.handleOnClickOrKeyboardSearch}
          autoCompleteOpen={autoCompleteOpen}
          showSearchResults={showSearchResults}
          resultPanelCollapsed={resultPanelCollapsed}
          toggleCollapseSearchResults={this.toggleCollapseSearchResults}
          handleOnAutocompleteInputChange={this.handleOnAutocompleteInputChange}
          handleOnClear={this.handleOnClear}
          autocompleteList={autocompleteList}
          searchModel={this.searchModel}
          searchOptions={searchOptions}
          updateSearchOptions={this.updateSearchOptions}
          setSearchSources={this.setSearchSources}
          loading={loading}
          searchSources={searchSources}
          handleSearchBarKeyPress={this.handleSearchBarKeyPress}
          getArrayWithSearchWords={this.getArrayWithSearchWords}
          failedWFSFetchMessage={failedWFSFetchMessage}
          {...this.props}
        />
      )
    );
  }
}
export default withStyles(styles)(withSnackbar(Search));
