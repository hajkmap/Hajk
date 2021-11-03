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
});

class SearchResultsDatasetFeatureDetails extends React.PureComponent {
  state = {
    infoBox: null,
  };

  constructor(props) {
    super(props);

    this.featurePropsParsing = new FeaturePropsParsing({
      globalObserver: props.app.globalObserver,
      options:
        props.app.appModel.config.mapConfig.tools.find(
          (t) => t.type === "infoclick"
        )?.options || [], // featurePropsParsing needs to know if FeatureInfo is configured to allow HTML or not, so we pass on its' options
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
    const { feature } = this.props;
    const source = feature.source ?? this.props.source;
    return source.infobox && source.infobox !== "";
  };

  getHtmlItemInfoBox = () => {
    const { feature } = this.props;
    const source = feature.source ?? this.props.source;
    feature.setProperties(
      this.featurePropsParsing.extractPropertiesFromJson(
        feature.getProperties()
      )
    );
    this.featurePropsParsing
      .setMarkdownAndProperties({
        markdown: source.infobox,
        properties: feature.getProperties(),
      })
      .mergeFeaturePropsWithMarkdown()
      .then((MarkdownComponent) => {
        this.setState({ infoBox: MarkdownComponent });
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
          <TableBody>
            {Object.entries(feature.getProperties()).map((row) => {
              return (
                <TableRow key={row[0]}>
                  {this.renderTableCell(row[0])}
                  {this.renderTableCell(row[1], "right")}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  handleTogglerPressed = (nextFeatureIndex) => {
    const { setActiveFeature, features } = this.props;
    const nextFeature = features[nextFeatureIndex];
    setActiveFeature(nextFeature);
  };

  getFeatureIndex = (feature, features) => {
    return (
      features?.findIndex((f) => {
        return f.getId() === feature.getId();
      }) ?? -1
    );
  };

  renderFeatureToggler = () => {
    const { feature, classes, features } = this.props;
    const numFeaturesInCollection = features.length;
    const currentFeatureIndex = this.getFeatureIndex(feature, features);

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
                  color={buttonLeftDisabled ? "disabled" : "action"}
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
                  color={buttonRightDisabled ? "disabled" : "action"}
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
    const { classes, features, enableFeatureToggler } = this.props;
    const { infoBox } = this.state;
    const shouldRenderToggler =
      (enableFeatureToggler ?? true) && features?.length > 1;
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
