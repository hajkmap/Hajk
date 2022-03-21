import { useEffect, useState } from "react";

import { useMapClickViewerContext } from "components/MapClickViewer/MapClickViewerContext";
import FeaturePropsParsing from "components/FeatureInfo/FeaturePropsParsing";

const Markdown = (props) => {
  const { feature, featureCollection } = props;

  // This is what we will render
  const [reactComponent, setReactComponent] = useState(null);

  // Grab useful stuff
  const { globalObserver, infoclickOptions } = useMapClickViewerContext();

  useEffect(() => {
    // Initiate the MD parser
    const featurePropsParsing = new FeaturePropsParsing({
      globalObserver: globalObserver,
      options: infoclickOptions || [], // featurePropsParsing needs to know if FeatureInfo is configured to allow HTML or not, so we pass on its' options
    });

    featurePropsParsing
      .setMarkdownAndProperties({
        markdown: featureCollection.infoclickDefinition,
        properties: featurePropsParsing.extractPropertiesFromJson(
          feature.getProperties()
        ),
      })
      .mergeFeaturePropsWithMarkdown()
      .then((MarkdownComponent) => {
        setReactComponent(MarkdownComponent); // Log above runs - but we hit endless loop here, as this leads to re-renders
      })
      .catch((error) => {
        setReactComponent(null);
      });
  }, [feature, featureCollection, globalObserver, infoclickOptions]);

  return reactComponent;
};

export default Markdown;
