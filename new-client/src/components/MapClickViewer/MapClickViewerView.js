import React, { useEffect, useState } from "react";

import FeatureCollectionsListView from "./views/FeatureCollectionsListView";

const MapClickViewerView = (props) => {
  const { featureCollections } = props;

  const [selectedFeatureCollection, setSelectedFeatureCollection] =
    useState(null);

  useEffect(() => {
    console.log(
      "featureCollection changed, resetting selected feature collection"
    );
    setSelectedFeatureCollection(null);
  }, [featureCollections]);

  return (
    selectedFeatureCollection === null && (
      <FeatureCollectionsListView
        featureCollections={featureCollections}
        selectedFeatureCollection={selectedFeatureCollection}
        setSelectedFeatureCollection={setSelectedFeatureCollection}
      />
    )
  );
};

export default MapClickViewerView;
