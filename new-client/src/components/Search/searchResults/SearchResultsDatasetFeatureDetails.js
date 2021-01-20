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
  headerTypography: {
    maxWidth: "100%",
    fontSize: 18,
  },
  headerContainer: {
    paddingTop: theme.spacing(1),
  },
  togglerButton: {
    minWidth: 26,
    padding: 0,
  },
  togglerButtonIcon: {
    color: theme.palette.text.primary,
  },
});

class SearchResultsDatasetFeatureDetails extends React.PureComponent {
  state = {
    infoBox: null,
  };

  constructor(props) {
    super(props);

    this.featurePropsParsing = new FeaturePropsParsing({
      globalObserver: props.app.globalObserver,
    });
  }

  componentDidMount = () => {
    this.getInfoBox();
  };

  componentDidUpdate = (prevProps) => {
    const { feature } = this.props;
    const prevFeature = prevProps.feature;
    if (feature !== prevFeature) {
      this.getInfoBox();
    }
  };

  getInfoBox = () => {
    if (this.shouldRenderCustomInfoBox()) {
      this.getHtmlItemInfoBox();
    } else {
      this.getDefaultInfoBox();
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
        this.setState({ infoBox: this.renderCustomInfoBox(featureInfo) });
      });
  };

  getDefaultInfoBox = () => {
    this.setState({ infoBox: this.renderDefaultInfoBox() });
  };

  renderTableCell = (content, position) => {
    const { classes } = this.props;
    const textToRender = Array.isArray(content) ? content.join(", ") : content;
    return (
      <TableCell
        align={position}
        style={position === "right" ? { paddingRight: 0 } : null}
        className={classes.tableCell}
      >
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

  renderCustomInfoBox = (featureInfo) => {
    return featureInfo.map((element, index) => {
      if (typeof element == "string") {
        return <Typography key={index}>{element}</Typography>;
      }
      return <React.Fragment key={index}>{element}</React.Fragment>;
    });
  };

  getFeatureFromCollectionByIndex = (featureIndex) => {
    const { featureCollection } = this.props;
    return featureCollection?.value?.features[featureIndex];
  };

  handleTogglerPressed = (nextFeatureIndex) => {
    const { setActiveFeature } = this.props;
    const nextFeature = this.getFeatureFromCollectionByIndex(nextFeatureIndex);
    setActiveFeature(nextFeature);
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
      <Grid container item alignItems="center" justify="space-between">
        <Grid item>
          <Tooltip
            title={
              !buttonLeftDisabled
                ? "Visa föregående objekt i resultatlistan"
                : ""
            }
          >
            <span>
              <Button
                size="small"
                variant="outlined"
                className={classes.togglerButton}
                disabled={buttonLeftDisabled}
                onClick={() =>
                  this.handleTogglerPressed(currentFeatureIndex - 1)
                }
                aria-label="show-previous-feature"
                id="step-left"
              >
                <ArrowLeftIcon
                  fontSize="small"
                  className={classes.togglerButtonIcon}
                />
              </Button>
            </span>
          </Tooltip>
        </Grid>
        <Grid item>
          <Tooltip
            title={
              !buttonRightDisabled ? "Visa nästa objekt i resultatlistan" : ""
            }
          >
            <span>
              <Button
                size="small"
                variant="outlined"
                className={classes.togglerButton}
                disabled={buttonRightDisabled}
                onClick={() =>
                  this.handleTogglerPressed(currentFeatureIndex + 1)
                }
                aria-label="show-next-feature"
                id="step-left"
              >
                <ArrowRightIcon
                  fontSize="small"
                  className={classes.togglerButtonIcon}
                />
              </Button>
            </span>
          </Tooltip>
        </Grid>
      </Grid>
    );
  };

  renderFeatureTitle = () => {
    const { featureTitle, classes } = this.props;
    return (
      <Typography
        noWrap
        className={classes.headerTypography}
        component="div"
        variant="button"
        align="left"
      >
        {featureTitle}
      </Typography>
    );
  };

  render() {
    const { classes, featureCollection } = this.props;
    const { infoBox } = this.state;
    const shouldRenderToggler =
      this.getNumFeaturesInCollection(featureCollection) > 1;
    return (
      <Grid container className={classes.allFeatureDetailsContainer}>
        <Grid container alignItems="center" className={classes.headerContainer}>
          <Grid
            item
            xs={shouldRenderToggler ? 9 : 12}
            md={shouldRenderToggler ? 10 : 12}
          >
            {this.renderFeatureTitle()}
          </Grid>
          {shouldRenderToggler && (
            <Grid item xs={3} md={2}>
              {this.renderFeatureToggler()}
            </Grid>
          )}
        </Grid>
        {infoBox && (
          <Grid item xs={12}>
            {infoBox}
          </Grid>
        )}
      </Grid>
    );
  }
}
export default withStyles(styles)(SearchResultsDatasetFeatureDetails);
