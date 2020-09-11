import React from "react";
import { withStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import cslx from "clsx";
import { Typography } from "@material-ui/core";
import {
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
  TableContainer,
} from "@material-ui/core";

const styles = (theme) => ({
  hidden: {
    display: "none",
  },
  tableCell: {
    paddingLeft: 0,
  },
  featureActionButton: {
    paddingLeft: 0,
  },
});

class SearchResultsDatasetFeature extends React.PureComponent {
  state = {
    showAllInformation: false,
  };

  showDetails = (e) => {
    const { setSelectedFeatureAndSource, feature, source } = this.props;
    const selectedFeatureAndSource = { feature, source };
    setSelectedFeatureAndSource(selectedFeatureAndSource);
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

  render() {
    const { feature, handleOnResultClick, classes } = this.props;
    const { showAllInformation } = this.state;

    return (
      <TableContainer>
        <Table size={"small"} style={{ maxWidth: "100%" }}>
          <TableHead>
            <TableRow>
              <TableCell
                colSpan="6"
                variant="head"
                className={classes.tableCell}
              >
                <Button
                  className={classes.featureActionButton}
                  onClick={handleOnResultClick(feature)}
                >
                  <Typography align="left" variant="button">
                    {this.getFeatureTitle()}{" "}
                  </Typography>
                </Button>
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {Object.entries(feature.properties).map((row, index) => {
              if (index >= 2) {
                return (
                  <TableRow
                    className={cslx(
                      !showAllInformation ? classes.hidden : null
                    )}
                    key={row[0]}
                  >
                    {this.renderTableCell(row[0])}
                    {this.renderTableCell(row[1], "right")}
                  </TableRow>
                );
              } else {
                return (
                  <TableRow key={row[0]}>
                    {this.renderTableCell(row[0])}
                    {this.renderTableCell(row[1], "right")}
                  </TableRow>
                );
              }
            })}
          </TableBody>
        </Table>
        <Button
          color="primary"
          style={{ width: "100%" }}
          onClick={(e) => {
            e.stopPropagation();
            this.setState({
              showAllInformation: !this.state.showAllInformation,
            });
          }}
        >
          {showAllInformation ? "Visa mindre" : "Visa mer"}
        </Button>
      </TableContainer>
    );
  }
}
export default withStyles(styles)(SearchResultsDatasetFeature);
