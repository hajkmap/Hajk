// Make sure to only import the hooks you intend to use
import React, { useCallback, useEffect, useState } from "react";

import { styled } from "@mui/material/styles";
import { Button, Typography } from "@mui/material";

// import { useSnackbar } from "notistack";

// import useCookieStatus from "hooks/useCookieStatus";

import FeatureItem from "./FeatureItem";

// Hajk components are primarily styled in two ways:
// - Using the styled-utility, see: https://mui.com/system/styled/
// - Using the sx-prop, see: https://mui.com/system/basics/#the-sx-prop
// The styled-utility creates a reusable component, and might be the
// best choice if the style is to be applied in several places.

// The styled components should be created at the top of the document
// (but after imports) for consistency. Hajk does not have a naming
// convention for the styled components, but keep in mind to use names
// that does not collide with regular components. (E.g. a styled div
// should not be called Box).

// The example below shows how a <Button /> with a bottom margin can be created.
// Notice that we are also accessing the application theme.
const ButtonWithBottomMargin = styled(Button)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

function PropertyCheckerView(props) {
  console.log("PropertyCheckerView: ", props);
  // We're gonna need to access the snackbar methods. Let's use the provided hook.
  // const { closeSnackbar, enqueueSnackbar } = useSnackbar();
  const [groupedFeatures, setGroupedFeatures] = useState({});

  // We're gonna need to use the event observers. Let's destruct them so that we can
  // get a hold of them easily. The observers can be accessed directly via the props:
  const { globalObserver, localObserver, drawModel } = props;

  // We're gonna need to keep track of if we're allowed to save stuff in LS. Let's use the hook.
  // const { functionalCookiesOk } = useCookieStatus(globalObserver);

  // Handles when user clicks the "Toggle draw interaction"-button
  const handleToggleDrawClick = () => {
    // First we'll get the current draw interaction and its setter from props
    const { drawInteraction, setDrawInteraction } = props;
    // If the draw-interaction is currently disabled (set to ""), we activate it (by setting it to "Polygon").
    // If it is currently active (not set to ""), we disable it.
    setDrawInteraction(drawInteraction === "" ? "Point" : "");
  };

  const handleCleanClick = () => {
    setGroupedFeatures({});
    drawModel.removeDrawnFeatures();
  };

  // This effect makes sure to subscribe (and unsubscribe) to the observer-events that we care about.
  React.useEffect(() => {
    const handleFeatureAdded = () => {
      // First we'll get the current draw interaction and its setter from props
      const { drawInteraction, setDrawInteraction } = props;
      // If the draw-interaction is currently disabled (set to ""), we activate it (by setting it to "Polygon").
      // If it is currently active (not set to ""), we disable it.
      setDrawInteraction(drawInteraction === "" ? "Point" : "");
    };

    const handleNewGetFeatureInfoFeatures = (groupedFeatures) => {
      console.log("groupedFeatures", groupedFeatures);
      setGroupedFeatures(groupedFeatures);
    };

    // Fires when a feature has been removed from the draw-source.
    // localObserver.subscribe("drawModel.featureRemoved", handleFeatureRemoved);
    // localObserver.subscribe("drawModel.featuresRemoved", handleFeaturesRemoved);
    localObserver.subscribe("drawModel.featureAdded", handleFeatureAdded);
    localObserver.subscribe(
      "getFeatureInfoFeatures",
      handleNewGetFeatureInfoFeatures
    );
    // localObserver.subscribe("kmlModel.fileImported", handleKmlFileImported);
    return () => {
      // localObserver.unsubscribe("drawModel.featureRemoved");
      // localObserver.unsubscribe("drawModel.featuresRemoved");
      localObserver.unsubscribe("drawModel.featureAdded", handleFeatureAdded);
      // localObserver.unsubscribe("kmlModel.fileImported");
    };
  }, [localObserver, props]);

  return (
    <>
      <ButtonWithBottomMargin
        variant="contained"
        fullWidth={true}
        color="primary"
        onClick={handleToggleDrawClick}
      >
        {props.drawInteraction === "" ? "Välj ny fastighet" : "Avbryt"}
      </ButtonWithBottomMargin>
      <ButtonWithBottomMargin
        variant="contained"
        fullWidth={true}
        color="secondary"
        onClick={handleCleanClick}
      >
        Rensa
      </ButtonWithBottomMargin>
      {Object.keys(groupedFeatures).length > 0 &&
        Object.entries(groupedFeatures).map(([k, features], i) => (
          <React.Fragment key={i}>
            <Typography>
              {features.features.length} lager påverkar fastigheten{" "}
              {features.markerFeature.get("fastighet")}
            </Typography>
            {features.features.map((f, j) => (
              <FeatureItem
                feature={f}
                key={j}
                olMap={props.app.map}
                globalObserver={globalObserver}
              />
            ))}
          </React.Fragment>
        ))}
    </>
  );
}

export default PropertyCheckerView;
