import React from "react";
import Alert from "@material-ui/lab/Alert";
import IconButton from "@material-ui/core/IconButton";
import MoreHorizIcon from "@material-ui/icons/MoreHoriz";
import SearchResultsList from "./SearchResultsList";
import Collapse from "@material-ui/core/Collapse";
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
} from "@material-ui/core";
import { withStyles } from "@material-ui/core/styles";

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
      position: "absolute",
      left: 0,
    },
  },
  filterInputFieldContainer: {
    padding: theme.spacing(1),
    borderTop: `${theme.spacing(0.1)}px solid ${theme.palette.divider}`,
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
    featureCollectionFilter: "",
    featureFilter: "",
  };

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

    this.setState({
      activeFeatureCollection: activeFeatureCollection,
      activeFeature: activeFeature,
    });
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

  isFilterActive = () => {
    const {
      activeFeatureCollection,
      featureFilter,
      featureCollectionFilter,
    } = this.state;
    return activeFeatureCollection && featureFilter.length > 0
      ? true
      : !activeFeatureCollection && featureCollectionFilter.length > 0
      ? true
      : false;
  };

  renderSearchResultListOptions = () => {
    const filterActive = this.isFilterActive();
    const helpText = filterActive ? "Filtret är aktivt" : "Filtrera resultatet";
    return (
      <Grid align="center" item xs={12}>
        <Typography variant="srOnly">{helpText}</Typography>
        <Tooltip title={helpText}>
          <Button
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
              Filtrera
            </Badge>
          </Button>
        </Tooltip>
        <Button>Sortera</Button>
        <IconButton>
          <MoreHorizIcon />
        </IconButton>
      </Grid>
    );
  };

  setActiveFeature = (feature) => {
    this.setState({ activeFeature: feature });
  };

  setActiveFeatureCollection = (featureCollection) => {
    this.setState({ activeFeatureCollection: featureCollection });
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

  render() {
    const {
      classes,
      app,
      getOriginBasedIcon,
      localObserver,
      panelCollapsed,
    } = this.props;
    const {
      sumOfResults,
      activeFeatureCollection,
      activeFeature,
      filterInputFieldOpen,
      featureFilter,
    } = this.state;

    const featureCollections =
      // Do we have an active (selected) featureCollection?
      activeFeatureCollection
        ? // Return a array containing only that collection
          [activeFeatureCollection]
        : // Otherwise we return all collections passing the filter
          this.getFilteredFeatureCollections(this.props.featureCollections);

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
                  {this.renderSearchResultListOptions()}
                  {filterInputFieldOpen && this.renderFilterInputField()}
                  <Grid item xs={12}>
                    <SearchResultsList
                      localObserver={localObserver}
                      getOriginBasedIcon={getOriginBasedIcon}
                      featureCollections={featureCollections}
                      app={app}
                      handleFeatureCollectionClick={
                        this.handleFeatureCollectionClick
                      }
                      setActiveFeature={this.setActiveFeature}
                      resetFeatureAndCollection={this.resetFeatureAndCollection}
                      activeFeatureCollection={activeFeatureCollection}
                      activeFeature={activeFeature}
                      featureFilter={featureFilter}
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
