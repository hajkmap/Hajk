import React, { useEffect, useState } from "react";

import FeatureCollectionsListView from "./views/FeatureCollectionsListView";
import FeaturesListView from "./views/FeaturesListView";

const MapClickViewerView = (props) => {
  const { featureCollections } = props;

  const [selectedFeatureCollection, setSelectedFeatureCollection] =
    useState(null);

  // If exactly ONE feature collection is returned, let's pre-select it.
  useEffect(() => {
    const preselectedFeatureCollection =
      featureCollections.length === 1 && featureCollections[0].layerId;
    setSelectedFeatureCollection(preselectedFeatureCollection || null);
  }, [featureCollections]);

  // Conditional render: if no feature collection is selected - render
  // a list of available collections. Else, render the selected collection's
  // items (i.e. FeatureListView).
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
