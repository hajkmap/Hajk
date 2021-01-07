import React from "react";
import Alert from "@material-ui/lab/Alert";
import SearchResultsList from "./SearchResultsList";
import Collapse from "@material-ui/core/Collapse";
import Breadcrumbs from "@material-ui/core/Breadcrumbs";
import Link from "@material-ui/core/Link";
import FilterListIcon from "@material-ui/icons/FilterList";
import SortIcon from "@material-ui/icons/Sort";
import MoreVertIcon from "@material-ui/icons/MoreVert";
import DeleteIcon from "@material-ui/icons/Delete";
import {
  Accordion,
  Paper,
  Button,
  AccordionDetails,
  Grid,
  TextField,
  Typography,
  Tooltip,
  Badge,
  Menu,
  MenuItem,
  Grow,
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
  expanded: {
    "&$expanded": {
      margin: theme.spacing(0),
      minHeight: theme.spacing(0),
    },
  },
  content: {
    margin: theme.spacing(0),
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
    },
  },
  filterInputFieldContainer: {
    padding: theme.spacing(1),
    borderTop: `${theme.spacing(0.1)}px solid ${theme.palette.divider}`,
  },
  headerContainer: {
    paddingRight: theme.spacing(1),
    paddingLeft: theme.spacing(1),
  },
  headerTypography: {
    maxWidth: "100%",
    fontSize: 18,
  },
  headerButtons: {
    minWidth: 30,
  },
  breadCrumbLinks: {
    cursor: "pointer",
  },
});

const TightAccordionDetails = withStyles({
  root: {
    padding: 0,
  },
})(AccordionDetails);

const TightAccordion = withStyles((theme) => ({
  root: {
    "&:last-child": {
      borderBottom: `${theme.spacing(0.1)}px solid ${theme.palette.divider}`,
    },
  },
}))(Accordion);

class SearchResultsContainer extends React.PureComponent {
  state = {
    sumOfResults: this.props.searchResults.featureCollections
      .map((fc) => fc.value.totalFeatures)
      .reduce((a, b) => a + b, 0),
    filterInputFieldOpen: false,
    featureCollectionFilter: "", // String used to filter featureCollections
    featureFilter: "", // String used to filter features
    sortingMenuAnchorEl: null,
    featureCollectionSortingStrategy: "AtoZ", // AtoZ representing alphabetical order
    featureSortingStrategy: "AtoZ",
    showTools: false,
  };

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

    // We first have to make sure that the list with all searchResults is mounted,
    // e.g. that activeFeature is unset.
    this.setState({ activeFeature: undefined }, () => {
      // Get the featureCollection which the clicked feature belongs to
      const featureCollection = this.getFeatureCollectionFromFeatureId(
        featureId
      );
      // Get the clicked feature
      const feature = featureCollection.value.features.find(
        (feature) => feature.id === featureId
      );
      // Set active collection and feature accordingly
      this.setState({
        activeFeatureCollection: featureCollection,
        activeFeature: feature,
      });
    });
  };

  getFeatureCollectionFromFeatureId = (featureId) => {
    const { featureCollections } = this.props;
    return featureCollections.find((featureCollection) => {
      return (
        featureCollection.value.features.findIndex(
          (feature) => feature.id === featureId
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
    // If we don't have a collection active, we know
    // that the filter is intended for the collections
    if (!this.state.activeFeatureCollection) {
      this.setState({
        featureCollectionFilter: e.target.value,
      });
    } else {
      // If we DO have a collection active, we know that
      // the filter is intended for the features in the active
      // collection
      this.setState({
        featureFilter: e.target.value,
      });
    }
  };

  renderFilterInputField = () => {
    const { classes } = this.props;
    const {
      activeFeatureCollection,
      featureFilter,
      featureCollectionFilter,
    } = this.state;
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
        ></TextField>
      </Grid>
    );
  };

  getFilteredFeatureCollections = () => {
    const { featureCollectionFilter } = this.state;
    const { featureCollections } = this.props;
    // Do we have a filter value?
    if (featureCollectionFilter.length > 0) {
      // Filter all collections
      return featureCollections.filter((featureCollection) => {
        // Returning collections where the filter is included in caption
        return featureCollection?.source?.caption
          .toLowerCase()
          .includes(featureCollectionFilter.toLowerCase());
      });
    } else {
      // No filter? Return all collections
      return featureCollections;
    }
  };

  // Helper function that checks if the filter is active in the
  // current view.
  isFilterActive = () => {
    const {
      activeFeatureCollection,
      featureFilter,
      featureCollectionFilter,
    } = this.state;
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

  renderSearchResultListOptions = () => {
    const { classes, featureCollections } = this.props;
    const {
      activeFeatureCollection,
      featureCollectionSortingStrategy,
      featureSortingStrategy,
    } = this.state;
    const filterActive = this.isFilterActive();
    const filterHelpText = filterActive
      ? "Filtret är aktivt"
      : "Filtrera resultatet";

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
      <Grid item container align="center" justify="flex-end">
        <Grow in={this.state.showTools} timeout={800}>
          <Grid item className={!this.state.showTools ? classes.hidden : null}>
            <Typography variant="srOnly">{filterHelpText}</Typography>
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
            <Typography variant="srOnly">{sortHelpText}</Typography>
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
            <Tooltip title="Rensa alla selekterade objekt">
              <Button
                className={classes.headerButtons}
                onClick={() => {
                  this.props.localObserver.publish(
                    "searchResultList.clearAllSelectedFeatures"
                  );
                }}
              >
                <DeleteIcon />
              </Button>
            </Tooltip>
            <SearchResultsDownloadMenu
              featureCollections={
                activeFeatureCollection
                  ? [activeFeatureCollection]
                  : featureCollections
              }
              localObserver={this.props.localObserver}
            />
          </Grid>
        </Grow>
        <Grid item>
          <Typography variant="srOnly">
            {`${this.state.showTools ? "Dölj" : "Visa"} verktyg`}
          </Typography>
          <Tooltip title={`${this.state.showTools ? "Dölj" : "Visa"} verktyg`}>
            <Button
              className={classes.headerButtons}
              onClick={() =>
                this.setState({
                  showTools: !this.state.showTools,
                })
              }
            >
              <MoreVertIcon />
            </Button>
          </Tooltip>
        </Grid>
      </Grid>
    );
  };

  setActiveFeature = (feature) => {
    this.setState({ activeFeature: feature });
  };

  setActiveFeatureCollection = (featureCollection) => {
    this.setState({
      activeFeatureCollection: featureCollection,
      filterInputFieldOpen: false,
      featureFilter: "",
    });
  };

  resetFeatureAndCollection = () => {
    this.setState({
      activeFeatureCollection: undefined,
      activeFeature: undefined,
    });
  };

  handleFeatureCollectionClick = (featureCollection) => {
    const { app } = this.props;
    const onClickName = featureCollection?.source?.onClickName;
    if (onClickName) {
      app.globalObserver.publish(
        `search.featureCollectionClicked.${onClickName}`,
        featureCollection
      );
    } else {
      this.setActiveFeatureCollection(featureCollection);
    }
  };

  sortFeatureCollections = (featureCollections) => {
    const { featureCollectionSortingStrategy } = this.state;

    const featureCollectionsAtoZSorted = featureCollections.sort((a, b) =>
      a.source.caption.localeCompare(b.source.caption, "sv")
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

  getFeatureTitle = (feature) => {
    const { activeFeatureCollection } = this.state;

    return activeFeatureCollection.source.displayFields.reduce(
      (featureTitleString, df) => {
        let displayField = feature.properties[df];
        if (Array.isArray(displayField)) {
          displayField = displayField.join(", ");
        }

        if (displayField) {
          if (featureTitleString.length > 0) {
            featureTitleString = featureTitleString.concat(
              ` | ${displayField}`
            );
          } else {
            featureTitleString = displayField.toString();
          }
        }

        return featureTitleString;
      },
      ""
    );
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
              color="textPrimary"
              variant="caption"
              onClick={(e) => {
                e.stopPropagation();
                this.resetFeatureAndCollection();
              }}
              onChange={this.resetFeatureAndCollection}
            >
              Sökresultat
            </Link>
          </Tooltip>
          <Tooltip title={featureCollectionTitle}>
            <Link
              className={classes.breadCrumbLinks}
              color="textPrimary"
              variant="caption"
              onClick={(e) => {
                e.stopPropagation();
                this.setActiveFeature(undefined);
              }}
            >
              {featureCollectionTitle}
            </Link>
          </Tooltip>
          {shouldRenderFeatureDetails && (
            <Tooltip title={featureTitle}>
              <Link
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

  renderHeaderInfoBar = (featureCollectionTitle, featureTitle) => {
    const { activeFeatureCollection, activeFeature } = this.state;
    const { classes, getOriginBasedIcon } = this.props;
    if (!activeFeature) {
      return (
        <Grid
          container
          item
          justify="space-between"
          alignItems="center"
          wrap="nowrap"
          xs={12}
        >
          <Grid container item wrap="nowrap" xs={this.state.showTools ? 5 : 11}>
            {activeFeatureCollection &&
              getOriginBasedIcon(activeFeatureCollection.origin)}
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
                  activeFeatureCollection
                    ? featureCollectionTitle
                    : "Sökresultat"
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
            {this.renderSearchResultListOptions()}
          </Grid>
        </Grid>
      );
    } else {
      return null;
    }
  };

  renderSearchResultsHeader = () => {
    const { classes } = this.props;
    const { activeFeatureCollection, activeFeature } = this.state;

    const featureCollectionTitle = activeFeatureCollection
      ? activeFeatureCollection.source.caption
      : "";
    const featureTitle = activeFeature
      ? this.getFeatureTitle(activeFeature)
      : "";

    return (
      <Grid className={classes.headerContainer} container item xs={12}>
        <Grid item xs={12}>
          {this.renderBreadCrumbs(featureCollectionTitle, featureTitle)}
        </Grid>
        {this.renderHeaderInfoBar(featureCollectionTitle, featureTitle)}
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
      showFeaturePreview,
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

    const sortedFeatureCollections = this.sortFeatureCollections(
      featureCollections
    );

    return (
      <Collapse in={!panelCollapsed}>
        {sumOfResults === 0 ? (
          <Paper className={classes.root}>
            <Alert severity="warning">Sökningen gav inget resultat.</Alert>
          </Paper>
        ) : (
          <Paper className={classes.root}>
            <TightAccordion>
              <TightAccordionDetails
                id="search-result-list"
                className={classes.searchResultListWrapper}
              >
                <Grid container>
                  {this.renderSearchResultsHeader()}
                  {filterInputFieldOpen && this.renderFilterInputField()}
                  {this.renderSortingMenu()}
                  <Grid item xs={12}>
                    <SearchResultsList
                      localObserver={localObserver}
                      getOriginBasedIcon={getOriginBasedIcon}
                      featureCollections={sortedFeatureCollections}
                      app={app}
                      handleFeatureCollectionClick={
                        this.handleFeatureCollectionClick
                      }
                      setActiveFeature={this.setActiveFeature}
                      resetFeatureAndCollection={this.resetFeatureAndCollection}
                      activeFeatureCollection={activeFeatureCollection}
                      activeFeature={activeFeature}
                      featureFilter={featureFilter}
                      featureCollectionSortingStrategy={
                        featureCollectionSortingStrategy
                      }
                      featureSortingStrategy={featureSortingStrategy}
                      showFeaturePreview={showFeaturePreview}
                      getFeatureTitle={this.getFeatureTitle}
                    />
                  </Grid>
                </Grid>
              </TightAccordionDetails>
            </TightAccordion>
          </Paper>
        )}
      </Collapse>
    );
  }
}

export default withStyles(styles)(SearchResultsContainer);
