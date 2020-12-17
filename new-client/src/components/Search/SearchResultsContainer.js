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

  renderSearchResultListOptions = () => {
    return (
      <Grid align="center" item xs={12}>
        <Button>Filtrera</Button>
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
    const { sumOfResults, activeFeatureCollection, activeFeature } = this.state;
    const featureCollections = activeFeatureCollection
      ? [activeFeatureCollection]
      : this.props.featureCollections;

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
