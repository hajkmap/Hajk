import React from "react";
import Alert from "@material-ui/lab/Alert";
import SearchResultsList from "./SearchResultsList";
import Collapse from "@material-ui/core/Collapse";
import Breadcrumbs from "@material-ui/core/Breadcrumbs";
import Link from "@material-ui/core/Link";
import FilterListIcon from "@material-ui/icons/FilterList";
import SortIcon from "@material-ui/icons/Sort";
import MoreVertIcon from "@material-ui/icons/MoreVert";
import CloseIcon from "@material-ui/icons/Close";
import DeleteIcon from "@material-ui/icons/Delete";
import ClearIcon from "@material-ui/icons/Clear";
import {
  Paper,
  Button,
  Grid,
  TextField,
  Typography,
  Tooltip,
  Badge,
  Menu,
  MenuItem,
  Grow,
  IconButton,
} from "@material-ui/core";
import { withStyles } from "@material-ui/core/styles";
import SearchResultsDownloadMenu from "./SearchResultsDownloadMenu";

const styles = (theme) => ({
  hidden: {
    display: "none",
  },
  searchResultListWrapper: {
    [theme.breakpoints.down("xs")]: {
      maxHeight: "78vh",
    },
    [theme.breakpoints.up("sm")]: {
      maxHeight: "82vh",
    },
  },
  root: {
    maxHeight: "80vh",
    overflow: "auto",
    minWidth: 200,
    [theme.breakpoints.up("sm")]: {
      maxWidth: 520,
    },
    [theme.breakpoints.down("xs")]: {
      minWidth: "100%",
      maxWidth: "100%",
      position: "absolute",
      left: 0,
      borderTop: `${theme.spacing(0.2)}px solid ${theme.palette.divider}`,
    },
  },
  filterInputFieldContainer: {
    padding: theme.spacing(1),
    borderBottom: `${theme.spacing(0.1)}px solid ${theme.palette.divider}`,
  },
  headerContainer: {
    paddingRight: theme.spacing(1),
    paddingLeft: theme.spacing(1),
  },
  tallHeaderContainer: {
    minHeight: 42,
    paddingRight: theme.spacing(1),
    paddingLeft: theme.spacing(1),
    borderBottom: `${theme.spacing(0.1)}px solid ${theme.palette.divider}`,
  },
  headerTypography: {
    maxWidth: "100%",
    fontSize: 18,
  },
  headerButtons: {
    minWidth: 30,
  },
  breadCrumbLinks: {
    border: "none",
    cursor: "pointer",
  },
});

class SearchResultsContainer extends React.PureComponent {
  state = {
    activeFeature: null,
    activeFeatureCollection: null,
    filteredFeatureCollections: null,
    filteredFeatures: null,
    sumOfResults: this.props.searchResults.featureCollections
      .map((fc) => fc.value.features.length ?? 0)
      .reduce((a, b) => a + b, 0),
    filterInputFieldOpen: false,
    featureCollectionFilter: "", // String used to filter featureCollections
    featureFilter: "", // String used to filter features
    sortingMenuAnchorEl: null,
    featureCollectionSortingStrategy: "AtoZ", // AtoZ representing alphabetical order
    featureSortingStrategy: "AtoZ",
    showTools: false,
    selectedFeatures: [],
  };

  // Used for setTimeout/clearTimeout, in order to delay filter update when user is typing
  filterInputTimer = null;
  lastFeatureFilter = "";
  lastFeatureCollectionFilter = "";

  // Amount of time before filter changes is committed
  delayBeforeFilterCommit = 300;

  searchResultTools = [
    {
      name: "Filtrera",
      type: "filter",
      render: () => this.renderFilterTool(),
      enabled: this.props.options.enableResultsFiltering ?? true,
    },
    {
      name: "Sortera",
      type: "sort",
      render: () => this.renderSortTool(),
      enabled: this.props.options.enableResultsSorting ?? true,
    },
    {
      name: "Rensa",
      type: "clear",
      render: () => this.renderClearTool(),
      enabled: this.props.options.enableResultsSelectionClearing ?? true,
    },
    {
      name: "Ladda ner",
      type: "download",
      render: () => this.renderDownloadTool(),
      enabled: this.props.options.enableResultsDownloading ?? true,
    },
  ];

  sortingStrategies = [
    {
      type: "AtoZ",
      name: "alfabetisk stigande",
      appliesTo: ["featureCollections", "features"],
    },
    {
      type: "ZtoA",
      name: "alfabetisk fallande",
      appliesTo: ["featureCollections", "features"],
    },
    {
      type: "numHits",
      name: "antal träffar",
      appliesTo: ["featureCollections"],
    },
  ];

  componentDidMount = () => {
    const { app } = this.props;
    app.globalObserver.subscribe(
      "infoClick.searchResultLayerClick",
      (features) => {
        const featureIds = features.map((feature) => {
          return feature.getId();
        });
        this.showFeatureDetails(featureIds);
      }
    );
    this.getPotentialSingleHit();
  };

  componentWillUnmount = () => {
    const { app } = this.props;
    app.globalObserver.unsubscribe("infoClick.searchResultLayerClick");
  };

  showFeatureDetails = (featureIds) => {
    const { toggleCollapseSearchResults } = this.props;
    const featureId = featureIds[0]; // Do we want to handle stacked features?

    // If searchResultContainer is collapsed, open it.
    if (this.props.panelCollapsed) toggleCollapseSearchResults();

    // Get the featureCollection which the clicked feature belongs to
    const featureCollection = this.getFeatureCollectionFromFeatureId(featureId);

    // If the collection has onClickName set we won't show the details
    if (featureCollection.source.onClickName) {
      return;
    }

    // Get the clicked feature
    const feature = featureCollection.value.features.find(
      (feature) => feature.getId() === featureId
    );

    // If the feature has onClickName set we won't show the details
    if (feature.onClickName) {
      return;
    }

    this.handleActiveFeatureChange(feature, featureCollection, "infoClick");
  };

  getFeatureCollectionFromFeatureId = (featureId) => {
    const { featureCollections } = this.props;
    return featureCollections.find((featureCollection) => {
      return (
        featureCollection.value.features.findIndex(
          (feature) => feature.getId() === featureId
        ) > -1
      );
    });
  };

  getPotentialSingleHit = () => {
    const { featureCollections } = this.props;

    const activeFeatureCollection =
      featureCollections.length === 1 ? featureCollections[0] : undefined;
    const activeFeature = activeFeatureCollection
      ? activeFeatureCollection.value.features.length === 1
        ? activeFeatureCollection.value.features[0]
        : undefined
      : undefined;

    // Hack hack.. we shouldn't set active collection and feature if we have a onClickName
    // on the source
    const shouldSetActiveFeatureOrCollection = activeFeatureCollection?.source
      ?.onClickName
      ? false
      : true;

    if (shouldSetActiveFeatureOrCollection) {
      this.setState({
        activeFeatureCollection: activeFeatureCollection,
        activeFeature: activeFeature,
      });
    }
  };

  handleFilterTextFieldInputChange = (e) => {
    const filterInput = e.target.value;
    this.updateViewFilters(filterInput);

    clearTimeout(this.filterInputTimer);
    this.filterInputTimer = setTimeout(() => {
      this.handleFilterUpdate();
    }, this.delayBeforeFilterCommit);
  };

  addFeatureToSelected = (feature) => {
    const selectedFeatures = [...this.state.selectedFeatures];
    selectedFeatures.push(feature);
    this.setState({ selectedFeatures: selectedFeatures });
    this.updateMapView(selectedFeatures);
  };

  removeFeatureFromSelected = (feature) => {
    const { activeFeatureCollection } = this.state;
    const selectedFeatures = [...this.state.selectedFeatures];

    const featureIndex = this.getSelectedFeatureIndex(feature.getId());
    selectedFeatures.splice(featureIndex, 1);

    if (activeFeatureCollection?.origin === "USERSELECT") {
      this.setState({
        selectedFeatures: selectedFeatures,
        activeFeatureCollection:
          selectedFeatures.length === 0
            ? null
            : this.getSelectedCollection(selectedFeatures),
      });
    } else {
      this.setState({ selectedFeatures: selectedFeatures });
    }
    this.updateMapView(selectedFeatures);
  };

  updateMapView = (selectedFeatures) => {
    const { localObserver } = this.props;
    localObserver.publish("map.setSelectedStyle", selectedFeatures);
    localObserver.publish("map.zoomToFeatures", selectedFeatures);
  };

  getSelectedFeatureIndex = (featureId) => {
    return this.state.selectedFeatures.findIndex((featureInfo) => {
      return featureInfo.feature.getId() === featureId;
    });
  };

  appendSelectedFeaturesCollection = (featureCollections) => {
    const { selectedFeatures } = this.state;
    if (this.state.selectedFeatures.length === 0) {
      return featureCollections;
    }
    const updatedCollections = [...featureCollections];
    updatedCollections.filter((fc) => {
      return fc.origin !== "USERSELECT";
    });
    updatedCollections.unshift(this.getSelectedCollection(selectedFeatures));
    return updatedCollections;
  };

  getSelectedCollection = (selectedFeatures) => {
    const features = selectedFeatures.reduce(
      (features, featureInfo) => [...features, featureInfo.feature],
      []
    );
    return {
      origin: "USERSELECT",
      source: { id: "userSelected", caption: "Markerade objekt" },
      value: {
        type: "featureCollection",
        features: features,
      },
    };
  };

  updateViewFilters = (filterInput) => {
    // If we don't have a collection active, we know
    // that the filter is intended for the collections
    if (!this.state.activeFeatureCollection) {
      this.setState({
        featureCollectionFilter: filterInput,
      });
    } else {
      // If we DO have a collection active, we know that
      // the filter is intended for the features in the active
      // collection
      this.setState({
        featureFilter: filterInput,
      });
    }
  };

  clearViewFilters = () => {
    if (!this.state.activeFeatureCollection) {
      this.setState(
        {
          featureCollectionFilter: "",
        },
        () => {
          this.handleFilterUpdate();
        }
      );
    } else {
      this.setState(
        {
          featureFilter: "",
        },
        () => {
          this.handleFilterUpdate();
        }
      );
    }
  };

  renderFilterInputField = () => {
    const { classes } = this.props;
    const { activeFeatureCollection, featureFilter, featureCollectionFilter } =
      this.state;
    const showClearFilterButton =
      featureFilter.length > 0 || featureCollectionFilter.length > 0;
    return (
      <Grid item className={classes.filterInputFieldContainer} xs={12}>
        <Typography variant="srOnly">
          Textfält för att filtrera resultatet
        </Typography>
        <TextField
          autoFocus
          onChange={this.handleFilterTextFieldInputChange}
          value={
            activeFeatureCollection ? featureFilter : featureCollectionFilter
          }
          fullWidth
          size="small"
          variant="outlined"
          label="Filtrera sökresultaten"
          InputProps={{
            endAdornment: showClearFilterButton && (
              <Tooltip title="Rensa filtret">
                <IconButton onClick={this.clearViewFilters} size="small">
                  <Typography variant="srOnly">Rensa filtret</Typography>
                  <ClearIcon />
                </IconButton>
              </Tooltip>
            ),
          }}
        ></TextField>
      </Grid>
    );
  };

  getFilteredFeatureCollections = () => {
    const { featureCollectionFilter, filteredFeatureCollections } = this.state;
    const { featureCollections } = this.props;
    // Do we have a filter value?
    if (this.lastFeatureCollectionFilter !== featureCollectionFilter) {
      // Filter all collections
      return featureCollections.filter((featureCollection) => {
        // Returning collections where the filter is included in caption
        return featureCollection?.source?.caption
          .toLowerCase()
          .includes(featureCollectionFilter.toLowerCase());
      });
    } else {
      // No filter update? Return all collections or last filtered.
      if (filteredFeatureCollections?.length > 0) {
        return filteredFeatureCollections;
      }
      return featureCollections;
    }
  };

  // Helper function that checks if the filter is active in the
  // current view.
  isFilterActive = () => {
    const { activeFeatureCollection, featureFilter, featureCollectionFilter } =
      this.state;
    // If we have an active featureCollection (meaning that we are
    // viewing _features_, and the featureFilter-value is set, the
    // filter is active.
    return activeFeatureCollection && featureFilter.length > 0
      ? true
      : // If we do not have an active featureCollection (meaning that
      // we are viewing _featureCollections_, and the featureCollection-
      // filter is set, the filter is active.
      !activeFeatureCollection && featureCollectionFilter.length > 0
      ? true
      : // Otherwise, the filter is not active.
        false;
  };

  getSortingStrategiesApplyingToView = (view) => {
    return this.sortingStrategies.filter((strategy) =>
      strategy.appliesTo.includes(view)
    );
  };

  handleSortingMenuItemClick = (type) => {
    const { activeFeatureCollection } = this.state;

    if (activeFeatureCollection) {
      this.setState({
        featureSortingStrategy: type,
        sortingMenuAnchorEl: null,
      });
    } else {
      this.setState({
        featureCollectionSortingStrategy: type,
        sortingMenuAnchorEl: null,
      });
    }
  };

  clearAllSelectedFeaturesInView = () => {
    const { localObserver } = this.props;
    const { activeFeatureCollection } = this.state;
    const sourceId = activeFeatureCollection?.source?.id;
    const onSelectedFeaturesView = sourceId === "userSelected";

    const selectedFeatures =
      !sourceId || onSelectedFeaturesView
        ? []
        : [...this.state.selectedFeatures].filter((featureInfo) => {
            return featureInfo.feature?.source.id !== sourceId;
          });
    this.setState({
      selectedFeatures: selectedFeatures,
      activeFeatureCollection: onSelectedFeaturesView
        ? null
        : activeFeatureCollection,
    });
    localObserver.publish("map.setSelectedStyle", selectedFeatures);
  };

  renderSortingMenu = () => {
    const {
      featureCollectionSortingStrategy,
      featureSortingStrategy,
      sortingMenuAnchorEl,
      activeFeatureCollection,
    } = this.state;

    const currentSortingStrategies = this.getSortingStrategiesApplyingToView(
      activeFeatureCollection ? "features" : "featureCollections"
    );
    return (
      <Menu
        anchorEl={sortingMenuAnchorEl}
        open={Boolean(sortingMenuAnchorEl)}
        onClose={() => this.setState({ sortingMenuAnchorEl: null })}
      >
        {currentSortingStrategies.map((strategy, index) => {
          return (
            <MenuItem
              selected={
                strategy.type ===
                (activeFeatureCollection
                  ? featureSortingStrategy
                  : featureCollectionSortingStrategy)
              }
              onClick={() => this.handleSortingMenuItemClick(strategy.type)}
              key={index}
              value={strategy.type}
            >
              {`${strategy.name[0].toUpperCase()}${strategy.name.slice(1)}`}
            </MenuItem>
          );
        })}
      </Menu>
    );
  };

  renderFilterTool = () => {
    const { classes } = this.props;
    const filterActive = this.isFilterActive();
    const filterHelpText = filterActive
      ? "Filtret är aktivt"
      : "Filtrera resultatet";
    return (
      <Tooltip title={filterHelpText}>
        <Button
          className={classes.headerButtons}
          onClick={() =>
            this.setState({
              filterInputFieldOpen: !this.state.filterInputFieldOpen,
            })
          }
        >
          <Badge
            color="primary"
            badgeContent=" "
            variant="dot"
            invisible={!filterActive}
          >
            <FilterListIcon />
          </Badge>
        </Button>
      </Tooltip>
    );
  };

  renderSortTool = () => {
    const { classes } = this.props;
    const {
      activeFeatureCollection,
      featureCollectionSortingStrategy,
      featureSortingStrategy,
    } = this.state;

    const sortHelpText = `Sortera resultatet, sorterar nu enligt ${
      // Get current sorting strategy from the array of strategies
      this.sortingStrategies.find(
        // by finding...
        (strategy) =>
          // the strategy with the "type"-value...
          strategy.type ===
          // corresponding to either the current feature or featureCollection
          // sorting strategy (depending on if we have an active collection or not)
          (activeFeatureCollection
            ? featureSortingStrategy
            : featureCollectionSortingStrategy)
      ).name // And it is the name value of the strategy we want to show
    }`;

    return (
      <Tooltip title={sortHelpText}>
        <Button
          className={classes.headerButtons}
          onClick={(e) =>
            this.setState({ sortingMenuAnchorEl: e.currentTarget })
          }
        >
          <SortIcon />
        </Button>
      </Tooltip>
    );
  };

  renderClearTool = () => {
    const { classes } = this.props;
    return (
      <Tooltip title="Rensa alla selekterade objekt">
        <Button
          className={classes.headerButtons}
          onClick={this.clearAllSelectedFeaturesInView}
        >
          <DeleteIcon />
        </Button>
      </Tooltip>
    );
  };

  renderDownloadTool = () => {
    const collectionsToDownload = this.getCollectionsToDownload();
    return (
      <SearchResultsDownloadMenu
        featureCollections={collectionsToDownload}
        localObserver={this.props.localObserver}
      />
    );
  };

  getCollectionsToDownload = () => {
    const {
      activeFeatureCollection,
      filteredFeatureCollections,
      featureFilter,
    } = this.state;
    const { featureCollections } = this.props;

    if (activeFeatureCollection) {
      if (activeFeatureCollection.source.id === "userSelected") {
        return [activeFeatureCollection];
      }
      if (featureFilter === "") {
        return [activeFeatureCollection];
      }
      const filteredFeatures = this.getFilteredFeatures([
        activeFeatureCollection,
      ]);
      const collectionToDownload = {
        ...activeFeatureCollection,
        value: { features: filteredFeatures },
      };
      return [collectionToDownload];
    }
    if (filteredFeatureCollections) {
      return filteredFeatureCollections;
    }

    return featureCollections;
  };

  allToolsDisabled = () => {
    return this.searchResultTools.filter((tool) => tool.enabled).length === 0;
  };

  renderSearchResultListTools = () => {
    const { classes } = this.props;
    if (this.allToolsDisabled()) {
      return null;
    } else {
      return (
        <Grid item container align="center" justify="flex-end">
          <Grow in={this.state.showTools} timeout={800}>
            <Grid
              item
              className={!this.state.showTools ? classes.hidden : null}
            >
              {this.searchResultTools.map((tool, index) => {
                return (
                  tool.enabled && (
                    <React.Fragment key={index}>{tool.render()}</React.Fragment>
                  )
                );
              })}
            </Grid>
          </Grow>
          <Grid item>
            <Tooltip
              title={`${this.state.showTools ? "Dölj" : "Visa"} verktyg`}
            >
              <Button
                className={classes.headerButtons}
                onClick={() =>
                  this.setState({
                    showTools: !this.state.showTools,
                    filterInputFieldOpen: false,
                  })
                }
              >
                {this.state.showTools ? <CloseIcon /> : <MoreVertIcon />}
              </Button>
            </Tooltip>
          </Grid>
        </Grid>
      );
    }
  };

  setActiveFeature = (feature) => {
    const { activeFeatureCollection } = this.state;
    this.handleActiveFeatureChange(feature, activeFeatureCollection);
  };

  handleActiveFeatureChange = (nextFeature, nextCollection, initiator) => {
    const { localObserver } = this.props;
    const { activeFeature } = this.state;
    const selectedFeatures = [...this.state.selectedFeatures];
    const shouldZoomToFeature = initiator !== "infoClick";

    if (activeFeature) {
      const featureIndex = selectedFeatures.findIndex((featureInfo) => {
        return (
          featureInfo.feature.getId() === activeFeature.getId() &&
          featureInfo.initiator !== "userSelect"
        );
      });
      featureIndex !== -1 && selectedFeatures.splice(featureIndex, 1);
      localObserver.publish("map.setSelectedStyle", selectedFeatures);
    }

    if (nextFeature) {
      const nextFeatureSelected = this.featureIsSelected(nextFeature);
      !nextFeatureSelected &&
        selectedFeatures.push(
          this.getNextFeatureInfo(nextFeature, nextCollection, initiator)
        );
    }
    this.setState(
      {
        selectedFeatures: selectedFeatures,
        activeFeatureCollection: nextCollection,
        activeFeature: nextFeature,
        filterInputFieldOpen: false,
        featureFilter: !nextCollection ? "" : this.state.featureFilter,
      },
      () => {
        !nextCollection && this.handleFilterUpdate();
      }
    );
    if (nextFeature) {
      if (shouldZoomToFeature) {
        localObserver.publish("map.zoomToFeature", nextFeature);
      }
      localObserver.publish("map.setHighLightedStyle", nextFeature);
    } else {
      localObserver.publish("map.setSelectedStyle", selectedFeatures);
    }
  };

  featureIsSelected = (feature) => {
    const { selectedFeatures } = this.state;
    return selectedFeatures.some((featureInfo) => {
      return featureInfo.feature.getId() === feature.getId();
    });
  };

  getNextFeatureInfo = (nextFeature, nextCollection, initiator) => {
    if (!nextFeature.source) {
      nextFeature.source = nextCollection.source;
    }

    return {
      feature: nextFeature,
      sourceId: nextFeature.source ?? nextCollection.source.id,
      initiator: initiator,
    };
  };

  setActiveFeatureCollection = (featureCollection) => {
    this.setState(
      {
        activeFeatureCollection: featureCollection,
        filterInputFieldOpen: false,
        featureFilter: "",
      },
      () => {
        this.handleFilterUpdate();
        this.#showCorrespondingWMSLayers(featureCollection);
      }
    );
  };

  #showCorrespondingWMSLayers = (featureCollection) => {
    // Respect the setting from admin
    if (this.props.options.showCorrespondingWMSLayers !== true) return;

    const layer = this.#getLayerById(featureCollection.source.pid);

    if (layer.layerType === "group") {
      // Group layers will publish an event to LayerSwitcher that will take
      // care of the somewhat complicated toggling.

      // N.B. We don't want to hide any sublayers, only ensure that new ones are shown.
      // So the first step is to find out which sublayers are already visible.
      const alreadyVisibleSubLayers = layer
        .getSource()
        .getParams()
        ["LAYERS"].split(",")
        .filter((e) => e.length !== 0);

      // Next, prepare an array of the already visible layers, plus the new one.
      // Make sure NOT TO CHANGE THE ORDER of sublayers. Hence no push or spread,
      // only a filter on the admin-specified order that we have in the 'subLayers'
      // property.
      const subLayersToShow = layer.subLayers.filter((l) => {
        return (
          alreadyVisibleSubLayers.includes(l) ||
          l === featureCollection.source.id
        );
      });

      // Finally, let's publish the event so that LayerSwitcher can take care of the rest
      this.props.app.globalObserver.publish("layerswitcher.showLayer", {
        layer,
        subLayersToShow,
      });
    } else if (!layer.getVisible()) {
      // "Normal" layers are easier, we can just toggle the visibility directly.
      // The already existing OL listener will update checkbox state on corresponding layer.
      layer.setVisible(true);
    }
  };

  #getLayerById = (layerId) => {
    return this.props.map
      .getLayers()
      .getArray()
      .find((layer) => {
        return layerId === layer.values_.name;
      });
  };

  handleFeatureCollectionClick = (featureCollection) => {
    const { app } = this.props;
    const onClickName = featureCollection?.source?.onClickName;
    if (onClickName) {
      app.globalObserver.publish(
        `search.featureCollectionClicked`,
        featureCollection
      );
    } else {
      this.setActiveFeatureCollection(featureCollection);
    }
  };

  sortFeatureCollections = (featureCollections) => {
    const { featureCollectionSortingStrategy } = this.state;

    const featureCollectionsAtoZSorted = featureCollections.sort((a, b) =>
      a.source.caption.localeCompare(b.source.caption)
    );

    switch (featureCollectionSortingStrategy) {
      case "numHits":
        return featureCollections.sort((a, b) =>
          a.value.totalFeatures > b.value.totalFeatures ? -1 : 1
        );
      case "ZtoA":
        return featureCollectionsAtoZSorted.reverse();
      default:
        // AtoZ
        return featureCollectionsAtoZSorted;
    }
  };

  keyPressIsEnter = (event) => {
    return event.which === 13 || event.keyCode === 13;
  };

  getFilteredFeatures = (featureCollections) => {
    const { activeFeatureCollection, featureFilter } = this.state;
    return featureCollections
      .map((fc) => {
        if (activeFeatureCollection) {
          if (fc.source.id === activeFeatureCollection.source.id) {
            return fc.value.features.filter((f) => {
              return f.featureTitle
                .toLowerCase()
                .includes(featureFilter.toLowerCase());
            });
          }
        }
        return fc.value.features;
      })
      .flat();
  };

  handleFilterUpdate = () => {
    const { featureCollectionFilter, featureFilter } = this.state;
    const { localObserver, featureCollections } = this.props;

    if (
      this.lastFeatureFilter === featureFilter &&
      this.lastFeatureCollectionFilter === featureCollectionFilter
    ) {
      return;
    }

    const filteredFeatureCollections =
      this.getFilteredFeatureCollections(featureCollections);
    const filteredFeatures = this.getFilteredFeatures(
      filteredFeatureCollections
    );
    const currentFeatureIds = filteredFeatures.map((feature) => {
      return feature.getId();
    });

    this.setState({
      filteredFeatureCollections: filteredFeatureCollections,
      filteredFeatures: filteredFeatures,
    });

    this.lastFeatureFilter = featureFilter;
    this.lastFeatureCollectionFilter = featureCollectionFilter;

    localObserver.publish("map.updateFeaturesAfterFilterChange", {
      features: filteredFeatures,
      featureIds: currentFeatureIds,
    });
  };

  renderBreadCrumbs = (featureCollectionTitle, featureTitle) => {
    const { classes } = this.props;
    const { activeFeatureCollection, activeFeature } = this.state;
    const shouldRenderFeatureCollectionDetails =
      activeFeatureCollection && !activeFeatureCollection.source.onClickName;
    const shouldRenderFeatureDetails =
      activeFeature && !activeFeature.onClickName;
    if (shouldRenderFeatureCollectionDetails) {
      return (
        <Breadcrumbs aria-label="breadcrumb" separator="/">
          <Tooltip title="Tillbaka till alla sökresultat">
            <Link
              className={classes.breadCrumbLinks}
              tabIndex={0}
              color="textPrimary"
              variant="caption"
              onClick={(e) => {
                e.stopPropagation();
                this.handleActiveFeatureChange();
              }}
              onKeyDown={(event) => {
                if (this.keyPressIsEnter(event)) {
                  this.handleActiveFeatureChange();
                }
              }}
              onChange={this.handleActiveFeatureChange}
            >
              Sökresultat
            </Link>
          </Tooltip>
          <Tooltip title={featureCollectionTitle}>
            <Link
              className={classes.breadCrumbLinks}
              tabIndex={0}
              color="textPrimary"
              variant="caption"
              onClick={(e) => {
                e.stopPropagation();
                this.setActiveFeature(undefined);
              }}
              onKeyDown={(event) => {
                if (this.keyPressIsEnter(event)) {
                  this.setActiveFeature(undefined);
                }
              }}
            >
              {featureCollectionTitle}
            </Link>
          </Tooltip>
          {shouldRenderFeatureDetails && (
            <Tooltip title={featureTitle}>
              <Link
                tabIndex={0}
                className={classes.breadCrumbLinks}
                color="textPrimary"
                variant="caption"
              >
                {featureTitle}
              </Link>
            </Tooltip>
          )}
        </Breadcrumbs>
      );
    } else {
      return null;
    }
  };

  renderHeaderInfoBar = (featureCollectionTitle) => {
    const { activeFeatureCollection } = this.state;
    const { classes } = this.props;
    return (
      <Grid
        container
        item
        justify="space-between"
        alignItems="center"
        wrap="nowrap"
        xs={12}
      >
        <Grid
          container
          item
          wrap="nowrap"
          alignItems="center"
          xs={this.state.showTools ? 5 : 11}
        >
          <Tooltip
            title={
              activeFeatureCollection ? featureCollectionTitle : "Sökresultat"
            }
          >
            <Typography
              variant="button"
              component="div"
              noWrap
              className={classes.headerTypography}
            >
              {`${
                activeFeatureCollection ? featureCollectionTitle : "Sökresultat"
              }`}
            </Typography>
          </Tooltip>
        </Grid>
        <Grid
          container
          item
          justify="flex-end"
          xs={this.state.showTools ? 7 : 1}
        >
          {this.renderSearchResultListTools()}
        </Grid>
      </Grid>
    );
  };

  renderSearchResultsHeader = () => {
    const { classes } = this.props;
    const { activeFeatureCollection, activeFeature } = this.state;

    const featureCollectionTitle = activeFeatureCollection
      ? activeFeatureCollection.source.caption
      : "";
    const featureTitle = activeFeature ? activeFeature.featureTitle : "";
    const shouldRenderHeaderInfoBar =
      !activeFeature || activeFeature?.onClickName;

    return (
      <Grid
        className={
          shouldRenderHeaderInfoBar
            ? classes.tallHeaderContainer
            : classes.headerContainer
        }
        container
        item
        xs={12}
      >
        <Grid item xs={12}>
          {this.renderBreadCrumbs(featureCollectionTitle, featureTitle)}
        </Grid>
        {shouldRenderHeaderInfoBar &&
          this.renderHeaderInfoBar(featureCollectionTitle, featureTitle)}
      </Grid>
    );
  };

  render() {
    const {
      classes,
      app,
      getOriginBasedIcon,
      localObserver,
      panelCollapsed,
      options,
    } = this.props;
    const {
      sumOfResults,
      activeFeatureCollection,
      activeFeature,
      filterInputFieldOpen,
      featureFilter,
      featureCollectionSortingStrategy,
      featureSortingStrategy,
    } = this.state;

    const featureCollections =
      // Do we have an active (selected) featureCollection?
      activeFeatureCollection
        ? // Return a array containing only that collection
          [activeFeatureCollection]
        : // Otherwise we return all collections passing the filter
          this.getFilteredFeatureCollections(this.props.featureCollections);

    const sortedFeatureCollections =
      this.sortFeatureCollections(featureCollections);

    const shouldRenderSelectedCollection =
      options.enableSelectedFeaturesCollection ?? true;

    const collectionsToRender = activeFeatureCollection
      ? [activeFeatureCollection]
      : shouldRenderSelectedCollection
      ? this.appendSelectedFeaturesCollection(sortedFeatureCollections)
      : sortedFeatureCollections;

    return (
      <Collapse in={!panelCollapsed}>
        {sumOfResults === 0 ? (
          <Paper className={classes.root}>
            <Alert severity="warning">Sökningen gav inget resultat.</Alert>
          </Paper>
        ) : (
          <Paper className={classes.root}>
            <Grid container className={classes.searchResultListWrapper}>
              {this.renderSearchResultsHeader()}
              {filterInputFieldOpen && this.renderFilterInputField()}
              {this.renderSortingMenu()}
              <Grid item xs={12}>
                <SearchResultsList
                  localObserver={localObserver}
                  getOriginBasedIcon={getOriginBasedIcon}
                  featureCollections={collectionsToRender}
                  app={app}
                  handleFeatureCollectionClick={
                    this.handleFeatureCollectionClick
                  }
                  setActiveFeature={this.setActiveFeature}
                  activeFeatureCollection={activeFeatureCollection}
                  activeFeature={activeFeature}
                  featureFilter={featureFilter}
                  featureCollectionSortingStrategy={
                    featureCollectionSortingStrategy
                  }
                  featureSortingStrategy={featureSortingStrategy}
                  enableFeaturePreview={options.enableFeaturePreview ?? true}
                  enableFeatureToggler={options.enableFeatureToggler ?? true}
                  addFeatureToSelected={this.addFeatureToSelected}
                  removeFeatureFromSelected={this.removeFeatureFromSelected}
                  selectedFeatures={this.state.selectedFeatures}
                  shouldRenderSelectedCollection={
                    shouldRenderSelectedCollection
                  }
                  options={options}
                />
              </Grid>
            </Grid>
          </Paper>
        )}
      </Collapse>
    );
  }
}

export default withStyles(styles)(SearchResultsContainer);
