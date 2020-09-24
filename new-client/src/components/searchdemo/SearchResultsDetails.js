import React from "react";
import { withStyles } from "@material-ui/core/styles";

import {
  Button,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Typography
} from "@material-ui/core";

import ArrowBackIcon from "@material-ui/icons/ArrowBack";

const styles = theme => ({});

class SearchResultsDetails extends React.PureComponent {
  render() {
    const {
      featureAndSource,
      showBackToResultsButton,
      handleBackToResultClick
    } = this.props;
    return (
      featureAndSource !== null && (
        <>
          {showBackToResultsButton && (
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={handleBackToResultClick}
            >
              Tillbaka till resultatlistan
            </Button>
          )}
          <Typography variant="subtitle1">
            {featureAndSource.source.caption}
          </Typography>
          <Table>
            <TableBody>
              {Object.entries(featureAndSource.feature.properties).map(row => (
                <TableRow key={row[0]}>
                  <TableCell>{row[0]}</TableCell>
                  <TableCell>{row[1]}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )
    );
  }
}
export default withStyles(styles)(SearchResultsDetails);
