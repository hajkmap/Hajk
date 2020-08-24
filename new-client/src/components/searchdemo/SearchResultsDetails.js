import React from "react";

import {
  Button,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Typography,
} from "@material-ui/core";

import ArrowBackIcon from "@material-ui/icons/ArrowBack";

export default function SearchResultsDetails({
  featureAndSource,
  showBackToResultsButton = true,
  setSelectedFeatureAndSource,
}) {
  const handleClick = () => {
    setSelectedFeatureAndSource(null);
  };

  return (
    featureAndSource !== null && (
      <>
        {showBackToResultsButton && (
          <Button startIcon={<ArrowBackIcon />} onClick={handleClick}>
            Tillbaka till resultatlistan
          </Button>
        )}
        <Typography variant="subtitle1">
          {featureAndSource.source.caption}
        </Typography>
        <Table>
          <TableBody>
            {Object.entries(featureAndSource.feature.properties).map((row) => (
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
