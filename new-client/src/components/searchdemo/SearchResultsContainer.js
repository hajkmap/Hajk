import React, { useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Paper } from "@material-ui/core";

import SearchResultsList from "./SearchResultsList";
import SearchResultsDetails from "./SearchResultsDetails";

const useStyles = makeStyles((theme) => ({
  root: {
    position: "absolute",
    width: 440,
    height: "100%",
    top: 0,
    left: 0,
    zIndex: -1,
    paddingTop: 160,
  },
}));
export default function SearchResultsContainer({
  searchResults: { featureCollections, errors },
  resultsSource,
  map,
}) {
  const classes = useStyles();
  // Depending on how many results were returned we will display either:
  // - the results list (>1 results), or
  // - the results details (exactly 1 result), or
  // - hide the results container (0 results)
  const sumOfResults = featureCollections
    .map((fc) => fc.value.totalFeatures)
    .reduce((a, b) => a + b, 0);

  const [selectedFeatureAndSource, setSelectedFeatureAndSource] = useState(
    null
  );

  const getTheSoleResult = () => {
    // Check which OL collection (i.e. "dataset") has the result
    const datasetWithTheSoleResult = featureCollections.find(
      (fc) => fc.value.totalFeatures === 1
    );

    if (datasetWithTheSoleResult === undefined) {
      return null;
    } else {
      // Grab the first result from that dataset
      const feature = datasetWithTheSoleResult.value.features[0];

      // Grab source
      const source = datasetWithTheSoleResult.source;

      return { feature, source };
    }
  };

  return sumOfResults === 0 ? null : (
    <Paper className={classes.root}>
      <SearchResultsDetails
        featureAndSource={
          sumOfResults === 1 ? getTheSoleResult() : selectedFeatureAndSource
        }
        setSelectedFeatureAndSource={setSelectedFeatureAndSource}
        showBackToResultsButton={sumOfResults === 1 ? false : true}
      />
      {sumOfResults > 1 && (
        <SearchResultsList
          featureCollections={featureCollections}
          resultsSource={resultsSource}
          map={map}
          setSelectedFeatureAndSource={setSelectedFeatureAndSource}
        />
      )}
    </Paper>
  );
}
