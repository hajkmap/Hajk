import AppModel from "models/AppModel";
import React, { useMemo } from "react";

import Breadcrumbs from "./Breadcrumbs";
import FeaturePagination from "./FeaturePagination";
import DefaultTable from "./renderers/DefaultTable";
import Markdown from "./renderers/Markdown";

const FeatureDetailView = (props) => {
  const {
    feature,
    featureCollection,
    selectedFeature,
    selectedFeatureCollection,
    setSelectedFeature,
    setSelectedFeatureCollection,
  } = props;

  // Memoize, no need to re-check all the time
  const shouldRenderMarkdown = useMemo(() => {
    return (
      typeof featureCollection.infoclickDefinition === "string" &&
      featureCollection.infoclickDefinition.trim().length > 0
    );
  }, [featureCollection]);

  // Memoize, no need to re-map all the time
  const paginationCollection = useMemo(() => {
    return featureCollection.features.map((f) => f.getId());
  }, [featureCollection]);

  return selectedFeature && feature ? (
    <>
      <Breadcrumbs
        setSelectedFeatureCollection={setSelectedFeatureCollection}
        setSelectedFeature={setSelectedFeature}
        featureCollection={featureCollection}
        feature={feature}
      />
      <FeaturePagination
        paginationCollection={paginationCollection}
        selectedFeature={selectedFeature}
        setSelectedFeature={setSelectedFeature}
      />
      {shouldRenderMarkdown === true ? (
        <Markdown feature={feature} featureCollection={featureCollection} />
      ) : (
        <DefaultTable feature={feature} />
      )}
    </>
  ) : null;
};

export default FeatureDetailView;
