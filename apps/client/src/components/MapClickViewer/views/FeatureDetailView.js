import React, { useEffect, useMemo } from "react";

import Breadcrumbs from "./Breadcrumbs";
import FeaturePagination from "./FeaturePagination";
import DefaultTable from "./renderers/DefaultTable";
import Markdown from "./renderers/Markdown";
import { useMapClickViewerContext } from "../MapClickViewerContext";

const FeatureDetailView = (props) => {
  const {
    feature,
    featureCollection,
    selectedFeatureId,
    setSelectedFeatureId,
    setSelectedFeatureCollection,
  } = props;

  const { appModel } = useMapClickViewerContext();

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

  useEffect(() => {
    appModel.highlight(feature || false);
  }, [feature, appModel]);

  return selectedFeatureId && feature ? (
    <>
      <Breadcrumbs
        setSelectedFeatureCollection={setSelectedFeatureCollection}
        setSelectedFeatureId={setSelectedFeatureId}
        featureCollection={featureCollection}
        feature={feature}
      />
      <FeaturePagination
        paginationCollection={paginationCollection}
        selectedFeatureId={selectedFeatureId}
        setSelectedFeatureId={setSelectedFeatureId}
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
