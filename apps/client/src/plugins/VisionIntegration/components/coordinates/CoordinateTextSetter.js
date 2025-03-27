import React from "react";
import { createPortal } from "react-dom";
import Dialog from "components/Dialog/Dialog";

// This component has a couple of responsibilities:
// - 1) Subscribe to coordinate-feature-creation
// - 2) Prompt the user with a modal containing a text-input-field
// - 3) Apply the text from the modal to the supplied feature.
const CoordinateTextSetter = ({ localObserver }) => {
  // We're gonna need to keep track of if we've been supplied with a feature
  // that we are supposed to apply text to.
  const [feature, setFeature] = React.useState(null);

  // We are going to need a handler for when the event on the observer fires.
  const handleFeatureCreated = React.useCallback((addedFeature) => {
    setFeature(addedFeature);
  }, []);

  // We are also going to need a handler for when the user closes the dialog
  const handleCloseClick = React.useCallback(
    (textFieldValue) => {
      feature.set("VISION_LABEL", textFieldValue);
      setFeature(null);
    },
    [feature]
  );

  // If the user aborts, we make sure to clear the feature locally
  const handleAbortClick = React.useCallback(() => {
    setFeature(null);
  }, []);

  // Let's add an effect where we can subscribe to the addFeature-event
  React.useEffect(() => {
    const coordinateCreatedListener = localObserver.subscribe(
      "mapView-new-coordinate-created",
      handleFeatureCreated
    );
    return () => {
      coordinateCreatedListener.unsubscribe();
    };
  }, [localObserver, handleFeatureCreated]);

  return feature !== null
    ? createPortal(
        <Dialog
          options={{
            text: "",
            prompt: true,
            headerText: "Ange etikett",
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

export default CoordinateTextSetter;
