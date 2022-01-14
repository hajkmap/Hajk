import React from "react";
import { createPortal } from "react-dom";
import Dialog from "../../../components/Dialog/Dialog";

// This component has a couple of responsibilities:
// - 1) Subscribe to text-feature-creation
// - 2) Prompt the user with a modal containing a text-input-field
// - 3) Applied the text from the modal to the supplied feature.
const FeatureTextSetter = ({ drawModel, localObserver }) => {
  // We're gonna need to keep track of if we've been supplied with a feature
  // that we are supposed to apply text to.
  const [feature, setFeature] = React.useState(null);

  // We are going to need a handler for when the event on the observer fires.
  const handleFeatureCreated = React.useCallback((addedFeature) => {
    // We're only interested in features with the type "Text"
    if (addedFeature.get("DRAW_METHOD") === "Text") {
      setFeature(addedFeature);
    }
  }, []);

  // We are also going to need a handler for when the user closes the dialog
  const handleCloseClick = React.useCallback(
    (textFieldValue) => {
      // If the user did not write any text, we remove the feature from
      // the draw-source. (Since we don't want text-features without text).
      if (textFieldValue.length === 0) {
        drawModel.removeFeature(feature);
      } else {
        feature.set("USER_TEXT", textFieldValue);
      }
      setFeature(null);
    },
    [drawModel, feature]
  );

  // If the user aborts, we make sure to remove the feature from the source
  const handleAbortClick = React.useCallback(() => {
    drawModel.removeFeature(feature);
    setFeature(null);
  }, [drawModel, feature]);

  // Let's add an effect where we can subscribe to the addFeature-event
  React.useEffect(() => {
    localObserver.subscribe("drawModel.featureAdded", handleFeatureCreated);
    return () => {
      localObserver.unsubscribe("drawModel.featureAdded");
    };
  }, [drawModel, localObserver, handleFeatureCreated]);

  return feature !== null
    ? createPortal(
        <Dialog
          options={{
            text: "",
            prompt: true,
            headerText: "Ange text",
            buttonText: "Ok",
            abortText: "Avbryt",
          }}
          open={feature !== null}
          onClose={handleCloseClick}
          onAbort={handleAbortClick}
        />,
        document.getElementById("map")
      )
    : null;
};

export default FeatureTextSetter;
