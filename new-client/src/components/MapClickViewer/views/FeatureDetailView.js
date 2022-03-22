import React from "react";

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

  const shouldRenderMarkdown = () =>
    typeof featureCollection.infoclickDefinition === "string" &&
    featureCollection.infoclickDefinition.trim().length > 0;

  const paginationCollection = featureCollection.features.map((f) => f.getId());

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
      {shouldRenderMarkdown() === true ? (
        <Markdown feature={feature} featureCollection={featureCollection} />
      ) : (
        <DefaultTable feature={feature} />
      )}
      <FeaturePagination
        paginationCollection={paginationCollection}
        selectedFeature={selectedFeature}
        setSelectedFeature={setSelectedFeature}
      />
    </>
  ) : null;
};

export default FeatureDetailView;
