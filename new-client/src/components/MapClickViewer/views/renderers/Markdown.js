import { useEffect, useState } from "react";

import { useMapClickViewerContext } from "components/MapClickViewer/MapClickViewerContext";

const Markdown = (props) => {
  const { feature, featureCollection } = props;

  // This is what we will render
  const [reactComponent, setReactComponent] = useState(null);

  // Grab useful stuff
  const { featurePropsParsing } = useMapClickViewerContext();

  useEffect(() => {
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
  }, [feature, featureCollection, featurePropsParsing]);

  return reactComponent;
};

export default Markdown;
