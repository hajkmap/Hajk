import React, { useEffect, useState } from "react";

import FeatureCollectionsListView from "./views/FeatureCollectionsListView";
import FeaturesListView from "./views/FeaturesListView";

const MapClickViewerView = (props) => {
  const { featureCollections } = props;

  const [selectedFeatureCollection, setSelectedFeatureCollection] =
    useState(null);

  useEffect(() => {
    setSelectedFeatureCollection(null);
  }, [featureCollections]);

  switch (selectedFeatureCollection) {
    case null:
      return (
        <FeatureCollectionsListView
          featureCollections={featureCollections}
          selectedFeatureCollection={selectedFeatureCollection}
          setSelectedFeatureCollection={setSelectedFeatureCollection}
        />
      );

    default:
      return (
        <FeaturesListView
          featureCollection={featureCollections.find(
            (fc) => fc.layerId === selectedFeatureCollection
          )}
          selectedFeatureCollection={selectedFeatureCollection}
          setSelectedFeatureCollection={setSelectedFeatureCollection}
        />
      );
  }
};

export default MapClickViewerView;
