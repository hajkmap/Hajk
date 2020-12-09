import React from "react";
import Alert from "@material-ui/lab/Alert";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import ExpandLessIcon from "@material-ui/icons/ExpandLess";
import ArrowBackIcon from "@material-ui/icons/ArrowBack";
import IconButton from "@material-ui/core/IconButton";
import MoreHorizIcon from "@material-ui/icons/MoreHoriz";
import SearchResultsList from "./SearchResultsList";
import {
  Accordion,
  Paper,
  Typography,
  Tooltip,
  Button,
  AccordionDetails,
  AccordionSummary,
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
    expanded: true,
    sumOfResults: this.props.searchResults.featureCollections
      .map((fc) => fc.value.totalFeatures)
      .reduce((a, b) => a + b, 0),
    activeFeatureCollection: undefined,
  };

  componentDidMount = () => {
    this.bindSubscriptions();
  };

  bindSubscriptions = () => {
    const { localObserver } = this.props;
    localObserver.subscribe("minimize-search-result-list", () => {
      this.setState({ expanded: false });
    });
  };

  renderSearchResultListOptions = () => {
    const { classes } = this.props;
    return (
      <Grid className={classes.hidden} item>
        <Button>Filtrera</Button>
        <Button>Sortera</Button>
        <IconButton>
          <MoreHorizIcon />
        </IconButton>
      </Grid>
    );
  };

  toggleResultListExpansion = () => {
    this.setState({ expanded: !this.state.expanded });
  };

  handleFeatureCollectionSelected = (featureCollection) => {
    this.setState({
      activeFeatureCollection: featureCollection,
    });
  };

  renderLeftHeaderInfo = () => {
    const { sumOfResults, activeFeatureCollection, expanded } = this.state;
    const { featureCollections } = this.props;

    if (!activeFeatureCollection || featureCollections.length === 1) {
      return <Typography>{`Visar ${sumOfResults} träffar`}</Typography>;
    } else if (activeFeatureCollection && expanded) {
      return (
        <Tooltip title={"Tillbaka till hela sökresultatet"}>
          <Button
            style={{ paddingLeft: 0 }}
            onClick={() => this.handleFeatureCollectionSelected()}
            color="primary"
          >
            <ArrowBackIcon fontSize="small" />
            Tillbaka
          </Button>
        </Tooltip>
      );
    } else {
      return (
        <Typography>{`Visar ${activeFeatureCollection.value.totalFeatures} träffar`}</Typography>
      );
    }
  };

  renderSearchResultContainerHeader = () => {
    return (
      <Grid justify="space-between" alignItems="center" container>
        <Grid item>{this.renderLeftHeaderInfo()}</Grid>
        <Grid item>{this.renderSearchResultListOptions()}</Grid>
        <Grid item>
          <Button
            onClick={this.toggleResultListExpansion}
            color="primary"
            endIcon={
              this.state.expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />
            }
          >
            {this.state.expanded ? `Dölj` : `Visa`}
          </Button>
        </Grid>
      </Grid>
    );
  };

  render() {
    const {
      classes,

      app,
      getOriginBasedIcon,
      localObserver,
    } = this.props;
    const { sumOfResults, activeFeatureCollection } = this.state;
    const featureCollections = activeFeatureCollection
      ? [activeFeatureCollection]
      : this.props.featureCollections;
    const showDetailedView = featureCollections.length === 1 ? true : false;

    return (
      <>
        {sumOfResults === 0 ? (
          <Paper className={classes.root}>
            <Alert severity="warning">Sökningen gav inget resultat.</Alert>
          </Paper>
        ) : (
          <Paper className={classes.root}>
            <TightAccordion
              expanded={this.state.expanded}
              TransitionProps={{ timeout: 100 }}
            >
              <AccordionSummary
                classes={{
                  content: classes.content,
                  expanded: classes.expanded,
                }}
                aria-controls="search-result-list"
                id="search-result-list-header"
              >
                {this.renderSearchResultContainerHeader()}
              </AccordionSummary>
              <TightAccordionDetails
                id="search-result-list"
                className={classes.searchResultListWrapper}
              >
                <SearchResultsList
                  localObserver={localObserver}
                  sumOfResults={sumOfResults}
                  getOriginBasedIcon={getOriginBasedIcon}
                  featureCollections={featureCollections}
                  app={app}
                  handleFeatureCollectionSelected={
                    this.handleFeatureCollectionSelected
                  }
                  showDetailedView={showDetailedView}
                />
              </TightAccordionDetails>
            </TightAccordion>
          </Paper>
        )}
      </>
    );
  }
}

export default withStyles(styles)(SearchResultsContainer);
