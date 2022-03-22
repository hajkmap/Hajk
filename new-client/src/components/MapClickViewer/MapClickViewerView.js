import React, { useEffect, useState } from "react";

import FeatureCollectionsListView from "./views/FeatureCollectionsListView";
import FeaturesListView from "./views/FeaturesListView";

const MapClickViewerView = (props) => {
  const { featureCollections } = props;

  const [selectedFeatureCollection, setSelectedFeatureCollection] =
    useState(null);

  // When new featureCollections arrive (via props), make sure to unset
  // the previously selectedFeatureCollection. We must do it, because
  // otherwise we can end up with the selectedFeatureCollection value
  // not existing in currently available featureCollections.
  useEffect(() => {
    setSelectedFeatureCollection(null);
  }, [featureCollections]);

  // Conditional render: if none feature collection is selected - render
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
