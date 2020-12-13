import React from "react";
import FeaturePropsParsing from "../../components/FeatureInfo/FeaturePropsParsing";
import { withStyles } from "@material-ui/core/styles";
import {
  Checkbox,
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Typography,
  Tooltip,
  Grid,
} from "@material-ui/core";

const styles = (theme) => ({
  tableCell: {
    paddingLeft: 0,
    wordBreak: "break-all",
    width: "50%",
  },
  featureDisplayFieldsContainer: {
    paddingLeft: 15,
  },
  allFeatureDetailsContainer: {
    maxWidth: "100%",
    padding: theme.spacing(2),
  },
  allFeatureDetailsHeader: {
    maxWidth: "100%",
    fontWeight: 500,
    paddingBottom: theme.spacing(1),
  },
});

class SearchResultsDatasetFeature extends React.PureComponent {
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

  renderTableCell = (content, position) => {
    const { classes } = this.props;
    const textToRender = Array.isArray(content) ? content.join(", ") : content;
    return (
      <TableCell align={position} className={classes.tableCell}>
        {textToRender}
      </TableCell>
    );
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

  getFeatureTitle = () => {
    const { feature, source } = this.props;

    return source.displayFields.reduce((featureTitleString, df) => {
      let displayField = feature.properties[df];
      if (Array.isArray(displayField)) {
        displayField = displayField.join(", ");
      }

      if (displayField) {
        if (featureTitleString.length > 0) {
          featureTitleString = featureTitleString.concat(` | ${displayField}`);
        } else {
          featureTitleString = displayField;
        }
      }

      return featureTitleString;
    }, "");
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

  renderShowInMapCheckbox = () => {
    const { feature, visibleInMap, showClickResultInMap } = this.props;
    const helpText = !visibleInMap ? "Visa i kartan" : "Ta bort från kartan";
    if (feature.geometry) {
      return (
        <Tooltip title={helpText}>
          <Checkbox
            color="primary"
            disableRipple
            checked={visibleInMap}
            onClick={(e) => e.stopPropagation()}
            onChange={() => showClickResultInMap(feature)}
            inputProps={{ "aria-label": "primary checkbox" }}
          />
        </Tooltip>
      );
    } else {
      return null;
    }
  };

  renderTightFeatureDetails = () => {
    const { classes, featureTitle } = this.props;
    if (featureTitle.length > 0) {
      return (
        <Grid
          container
          alignItems="center"
          className={classes.featureDisplayFieldsContainer}
        >
          <Grid item xs={10}>
            <Typography
              noWrap
              variant="subtitle1"
              align="left"
              style={{ maxWidth: "100%" }}
            >
              {featureTitle}
            </Typography>
          </Grid>
          <Grid item xs={2}>
            {this.renderShowInMapCheckbox()}
          </Grid>
        </Grid>
      );
    }
  };

  renderAllFeatureDetails = () => {
    const { classes, featureTitle } = this.props;

    return (
      <Grid container className={classes.allFeatureDetailsContainer}>
        <Grid item xs={12} align="center">
          <Typography noWrap className={classes.allFeatureDetailsHeader}>
            {featureTitle}
          </Typography>
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
  };

  render() {
    const { shouldRenderAllFeatureDetails } = this.props;
    if (shouldRenderAllFeatureDetails) {
      return <>{this.renderAllFeatureDetails()}</>;
    } else {
      return <>{this.renderTightFeatureDetails()}</>;
    }
  }
}
export default withStyles(styles)(SearchResultsDatasetFeature);
