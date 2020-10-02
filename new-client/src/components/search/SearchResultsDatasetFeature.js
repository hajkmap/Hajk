import React from "react";
import cslx from "clsx";
import {
  extractPropertiesFromJson,
  mergeFeaturePropsWithMarkdown,
} from "../../utils/FeaturePropsParsing";
import { withStyles } from "@material-ui/core/styles";
import {
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
  TableContainer,
  Typography,
  Button,
} from "@material-ui/core";

const styles = () => ({
  hidden: {
    display: "none",
  },
  tableCell: {
    paddingLeft: 0,
    wordBreak: "break-all",
  },
  customDetailsHtmlTypography: {
    overflow: "hidden",
  },
  showMoreInformationButton: {
    width: "100%",
  },
});

class SearchResultsDatasetFeature extends React.PureComponent {
  state = {
    showAllInformation: false,
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

  getHtmlItemInfoBox = (feature, infoBox) => {
    feature.properties = extractPropertiesFromJson(feature.properties);
    return mergeFeaturePropsWithMarkdown(infoBox, feature.properties);
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

  renderHiddenSection = (__hiddenSectionHtml) => {
    const { classes } = this.props;
    const { showAllInformation } = this.state;

    return (
      <Typography
        className={cslx(
          classes.customDetailsHtmlTypography,
          !showAllInformation ? classes.hidden : null
        )}
        component="tr"
        variant="body2"
        color="textPrimary"
        dangerouslySetInnerHTML={{
          __html: __hiddenSectionHtml,
        }}
      ></Typography>
    );
  };

  renderVisibleSection = (__visibleSectionHtml) => {
    const { classes } = this.props;

    return (
      <Typography
        className={classes.customDetailsHtmlTypography}
        component="tr"
        variant="body2"
        color="textPrimary"
        dangerouslySetInnerHTML={{
          __html: __visibleSectionHtml,
        }}
      ></Typography>
    );
  };

  renderDefaultInfoBoxTable = () => {
    const { feature, classes } = this.props;
    const { showAllInformation } = this.state;
    return Object.entries(feature.properties).map((row, index) => {
      return (
        <TableBody key={index}>
          <TableRow
            className={cslx(
              !showAllInformation && index >= 2 ? classes.hidden : null
            )}
            key={row[0]}
          >
            {this.renderTableCell(row[0])}
            {this.renderTableCell(row[1], "right")}
          </TableRow>
        </TableBody>
      );
    });
  };

  renderCustomInfoBoxTable = () => {
    const { feature, source } = this.props;
    const {
      __visibleSectionHtml,
      __hiddenSectionHtml,
    } = this.getHtmlItemInfoBox(feature, source.infobox);
    return (
      <TableBody>
        {this.renderVisibleSection(__visibleSectionHtml)}
        {this.renderHiddenSection(__hiddenSectionHtml)}
      </TableBody>
    );
  };

  shouldRenderCustomInfoBox = () => {
    const { source } = this.props;
    return (
      source.infobox &&
      source.infobox !== "" &&
      source.infobox.search("<section data-visible>") !== -1
    );
  };

  renderDetailsTitle = () => {
    const { classes } = this.props;
    return (
      <TableHead>
        <TableRow>
          <TableCell colSpan="6" variant="head" className={classes.tableCell}>
            <Typography variant="subtitle1" align="left">
              {this.getFeatureTitle()}
            </Typography>
          </TableCell>
        </TableRow>
      </TableHead>
    );
  };

  renderShowMoreInformationButton = () => {
    const { showAllInformation } = this.state;
    const { classes } = this.props;
    return (
      <Button
        color="primary"
        className={classes.showMoreInformationButton}
        onClick={(e) => {
          e.stopPropagation();
          this.setState({
            showAllInformation: !this.state.showAllInformation,
          });
        }}
      >
        {showAllInformation ? "Visa mindre" : "Visa mer"}
      </Button>
    );
  };

  render() {
    return (
      <TableContainer>
        <Table size={"small"}>
          {this.renderDetailsTitle()}
          {this.shouldRenderCustomInfoBox()
            ? this.renderCustomInfoBoxTable()
            : this.renderDefaultInfoBoxTable()}
        </Table>
        {this.renderShowMoreInformationButton()}
      </TableContainer>
    );
  }
}
export default withStyles(styles)(SearchResultsDatasetFeature);
