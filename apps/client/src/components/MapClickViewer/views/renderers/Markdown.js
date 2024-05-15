import { useEffect, useState } from "react";
import { Box } from "@mui/system";

import { useMapClickViewerContext } from "../../MapClickViewerContext";

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
        setReactComponent(MarkdownComponent);
      })
      .catch((error) => {
        setReactComponent(null);
      });
  }, [feature, featureCollection, featurePropsParsing]);

  return (
    <Box
      sx={{
        // Normally, text rendered in Window isn't selectable, as we see
        // it as an UI element. But MapClickViewer's content is an exception.
        userSelect: "text",
        cursor: "auto",
        // Let's ensure that <summary> elements do have the correct cursor.
        "& summary": {
          cursor: "pointer",
        },
      }}
    >
      {reactComponent}
    </Box>
  );
};

export default Markdown;
