import React from "react";
import FeaturePropsParsing from "../../FeatureInfo/FeaturePropsParsing";
import { withStyles } from "@material-ui/core/styles";
import {
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Typography,
  Grid,
  Button,
  Tooltip,
} from "@material-ui/core";
import ArrowLeftIcon from "@material-ui/icons/ArrowLeft";
import ArrowRightIcon from "@material-ui/icons/ArrowRight";

const styles = (theme) => ({
  tableCell: {
    paddingLeft: 0,
    wordBreak: "break-all",
    width: "50%",
  },
  allFeatureDetailsContainer: {
    maxWidth: "100%",
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
  },
  allFeatureDetailsHeader: {
    maxWidth: "100%",
    fontWeight: 500,
  },
  headerTypography: {
    maxWidth: "100%",
    fontSize: 18,
  },
  headerTitleContainer: {
    paddingTop: theme.spacing(1),
  },
  togglerContainer: {
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
  },
  toggler: {
    border: `${theme.spacing(0.2)}px solid ${theme.palette.divider}`,
  },
  togglerButtonRightContainer: {
    borderLeft: `${theme.spacing(0.2)}px solid ${theme.palette.divider}`,
  },
  togglerButtonLeftContainer: {
    borderRight: `${theme.spacing(0.2)}px solid ${theme.palette.divider}`,
  },
  togglerIcons: {
    color: theme.palette.text.primary,
  },
});

class SearchResultsDatasetFeatureDetails extends React.PureComponent {
  state = {
    featureInfo: null,
  };

  constructor(props) {
    super(props);

    this.featurePropsParsing = new FeaturePropsParsing({
      globalObserver: props.app.globalObserver,
    });
  }

  componentDidMount = () => {
    if (this.shouldRenderCustomInfoBox()) {
      this.getHtmlItemInfoBox();
    }
  };

  shouldRenderCustomInfoBox = () => {
    const { source } = this.props;
    return source.infobox && source.infobox !== "";
  };

  getHtmlItemInfoBox = () => {
    const { source, feature } = this.props;
    feature.properties = this.featurePropsParsing.extractPropertiesFromJson(
      feature.properties
    );
    this.featurePropsParsing
      .mergeFeaturePropsWithMarkdown(source.infobox, feature.properties)
      .then((featureInfo) => {
        this.setState({ featureInfo: featureInfo });
      });
  };

  renderTableCell = (content, position) => {
    const { classes } = this.props;
    const textToRender = Array.isArray(content) ? content.join(", ") : content;
    return (
      <TableCell align={position} className={classes.tableCell}>
        {textToRender}
      </TableCell>
    );
  };

  renderDefaultInfoBox = () => {
    const { feature } = this.props;
    return (
      <TableContainer>
        <Table size="small">
          {Object.entries(feature.properties).map((row, index) => {
            return (
              <TableBody key={index}>
                <TableRow key={row[0]}>
                  {this.renderTableCell(row[0])}
                  {this.renderTableCell(row[1], "right")}
                </TableRow>
              </TableBody>
            );
          })}
        </Table>
      </TableContainer>
    );
  };

  renderCustomInfoBox = () => {
    if (this.state.featureInfo) {
      return this.state.featureInfo.map((element, index) => {
        if (typeof element == "string") {
          return <Typography key={index}>{element}</Typography>;
        }
        return <React.Fragment key={index}>{element}</React.Fragment>;
      });
    }
  };

  getFeatureFromCollectionByIndex = (featureIndex) => {
    const { featureCollection } = this.props;
    return featureCollection?.value?.features[featureIndex];
  };

  handleTogglerPressed = (nextFeatureIndex) => {
    const { feature, localObserver, featureCollection } = this.props;
    const nextFeature = this.getFeatureFromCollectionByIndex(nextFeatureIndex);
    localObserver.publish("searchResultList.handleFeatureTogglerClicked", {
      currentFeature: feature,
      nextFeature: nextFeature,
      source: featureCollection.source,
    });
  };

  getNumFeaturesInCollection = (featureCollection) => {
    return featureCollection?.value?.features?.length ?? -1;
  };

  getFeatureIndexInCollection = (feature, featureCollection) => {
    return (
      featureCollection?.value?.features?.findIndex((f) => {
        return f.id === feature.id;
      }) ?? -1
    );
  };

  renderFeatureToggler = () => {
    const { feature, featureCollection, classes } = this.props;
    const numFeaturesInCollection = this.getNumFeaturesInCollection(
      featureCollection
    );
    const currentFeatureIndex = this.getFeatureIndexInCollection(
      feature,
      featureCollection
    );

    const buttonLeftDisabled = currentFeatureIndex - 1 < 0;
    const buttonRightDisabled =
      currentFeatureIndex + 1 >= numFeaturesInCollection;

    return (
      <Grid
        alignItems="center"
        justify="space-between"
        className={classes.toggler}
        container
      >
        <Grid item className={classes.togglerButtonLeftContainer}>
          <Tooltip
            title={
              !buttonLeftDisabled
                ? "Visa föregående objekt i resultatlistan"
                : ""
            }
          >
            <span>
              <Button
                fullWidth
                size="small"
                disabled={buttonLeftDisabled}
                onClick={() =>
                  this.handleTogglerPressed(currentFeatureIndex - 1)
                }
                aria-label="previous"
                id="step-left"
              >
                <ArrowLeftIcon className={classes.togglerIcons} />
              </Button>
            </span>
          </Tooltip>
        </Grid>
        <Grid item>
          <Typography
            variant="button"
            color="textPrimary"
            className={classes.typography}
          >
            {currentFeatureIndex + 1} av {numFeaturesInCollection}
          </Typography>
        </Grid>
        <Grid item className={classes.togglerButtonRightContainer}>
          <Tooltip
            title={
              !buttonRightDisabled ? "Visa nästa objekt i resultatlistan" : ""
            }
          >
            <span>
              <Button
                fullWidth
                size="small"
                disabled={buttonRightDisabled}
                onClick={() =>
                  this.handleTogglerPressed(currentFeatureIndex + 1)
                }
                aria-label="next"
                id="step-right"
              >
                <ArrowRightIcon className={classes.togglerIcons} />
              </Button>
            </span>
          </Tooltip>
        </Grid>
      </Grid>
    );
  };

  renderFeatureTitleHeader = () => {
    const { featureTitle, classes } = this.props;
    return (
      <Typography
        noWrap
        className={classes.headerTypography}
        component="div"
        variant="button"
      >
        {featureTitle}
      </Typography>
    );
  };

  render() {
    const { classes, featureCollection } = this.props;
    const shouldRenderToggler =
      this.getNumFeaturesInCollection(featureCollection) > 1;
    return (
      <Grid container className={classes.allFeatureDetailsContainer}>
        {shouldRenderToggler && (
          <Grid item xs={12} className={classes.togglerContainer}>
            {this.renderFeatureToggler()}
          </Grid>
        )}
        <Grid
          item
          xs={12}
          align="center"
          className={
            !shouldRenderToggler ? classes.headerTitleContainer : undefined
          }
        >
          {this.renderFeatureTitleHeader()}
        </Grid>
        {this.state.featureInfo && (
          <Grid item xs={12}>
            {this.renderCustomInfoBox()}
          </Grid>
        )}
        {!this.state.featureInfo && (
          <Grid item xs={12}>
            {this.renderDefaultInfoBox()}
          </Grid>
        )}
      </Grid>
    );
  }
}
export default withStyles(styles)(SearchResultsDatasetFeatureDetails);
