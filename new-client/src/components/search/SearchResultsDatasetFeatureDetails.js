import React from "react";
import FeaturePropsParsing from "../../components/FeatureInfo/FeaturePropsParsing";
import { withStyles } from "@material-ui/core/styles";
import {
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Typography,
  Grid,
} from "@material-ui/core";

const styles = (theme) => ({
  tableCell: {
    paddingLeft: 0,
    wordBreak: "break-all",
    width: "50%",
  },
  allFeatureDetailsContainer: {
    maxWidth: "100%",
    padding: theme.spacing(2),
  },
  allFeatureDetailsHeader: {
    maxWidth: "100%",
    fontWeight: 500,
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

  render() {
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
  }
}
export default withStyles(styles)(SearchResultsDatasetFeatureDetails);
