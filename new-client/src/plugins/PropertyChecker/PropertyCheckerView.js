// Make sure to only import the hooks you intend to use
import React, { useEffect, useRef, useState } from "react";

import useUpdateEffect from "../../hooks/useUpdateEffect.js";

import {
  Button,
  Card,
  CardActions,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import { useSnackbar } from "notistack";

// import useCookieStatus from "hooks/useCookieStatus";

import InfoDialog from "./views/InfoDialog.js";
import PropertyItem from "./views/PropertyItem.js";
import QuickLayerToggleButtons from "./views/QuickLayerToggleButtons.js";

const ButtonWithBottomMargin = styled(Button)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

function PropertyCheckerView(props) {
  const {
    drawModel,
    globalObserver,
    localObserver,
    drawInteraction,
    setDrawInteraction,
  } = props;

  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const snackbarId = useRef(null);

  const [groupedFeatures, setGroupedFeatures] = useState({});
  const [digitalPlanFeatures, setDigitalPlanFeatures] = useState([]);

  // We want to keep track of the clicked point's coordinates, to be able
  // to pass them down to child components.
  const [clickedPointsCoordinates, setClickedPointsCoordinates] = useState([]);

  // Keep visibility state for the dialog that we'll show to the user
  // when user clicks on the Clear button.
  const [clearDialogVisible, setClearDialogVisible] = useState(false);

  const handleShowConfirmationDialog = () => {
    setClearDialogVisible(true);
  };

  const handleCloseConfirmationDialog = () => {
    setClearDialogVisible(false);
  };

  // We're gonna need to keep track of if we're allowed to save stuff in LS. Let's use the hook.
  // const { functionalCookiesOk } = useCookieStatus(globalObserver);

  const handleToggleDrawClick = () => {
    setDrawInteraction(drawInteraction === "" ? "Point" : "");
  };

  const handleCleanClick = () => {
    setClearDialogVisible(false);
    setGroupedFeatures({});
    setDigitalPlanFeatures([]);
    drawModel.removeDrawnFeatures();
  };

  const [controlledLayers, setControlledLayers] = useState([]);

  // Subscribe and unsubscribe to events
  useEffect(() => {
    // Triggered when a feature is added to the Draw Model (in this case: when
    // user clicks a point on the map). We want to know when this happens so that
    // we can a) disable the draw interaction and b) grab the coordinates of the
    // clicked point.
    const handleFeatureAdded = (feature) => {
      setDrawInteraction("");
      setClickedPointsCoordinates(feature.getGeometry().getFlatCoordinates());
    };

    // This runs when our model has successfully fetched features and there's
    // at least one result.
    const handleNewGetFeatureInfoFeatures = ({
      digitalPlanFeatures,
      groupedFeatures,
    }) => {
      setGroupedFeatures(groupedFeatures);
      setDigitalPlanFeatures(digitalPlanFeatures);
    };

    // Sometimes we won't get a result for the clicked point, but we still want
    // to inform the user about it. We should also remove the clicked point feature
    // from map, otherwise we'd end up with multiple points as user clicks next time.
    const handleNoFeaturesInResult = () => {
      enqueueSnackbar("Den klickade ytan gav inga träffar", {
        variant: "info",
      });
      drawModel.removeDrawnFeatures();
    };

    // Subscriptions. See each handler for more comments.
    localObserver.subscribe("drawModel.featureAdded", handleFeatureAdded);
    localObserver.subscribe(
      "getFeatureInfoFeatures",
      handleNewGetFeatureInfoFeatures
    );
    localObserver.subscribe("noFeaturesInResult", handleNoFeaturesInResult);
    return () => {
      // Unsubscriptions.
      localObserver.unsubscribe("drawModel.featureAdded", handleFeatureAdded);
      localObserver.unsubscribe(
        "getFeatureInfoFeatures",
        handleNewGetFeatureInfoFeatures
      );
      localObserver.unsubscribe("noFeaturesInResult", handleNoFeaturesInResult);
    };
  }, [drawModel, enqueueSnackbar, localObserver, setDrawInteraction]);

  // useUpdateEffect ignores the first render, which is exactly what
  // we want.
  useUpdateEffect(() => {
    // If draw interaction is active…
    if (drawInteraction === "Point") {
      // …show the snackbar and save ID for later.
      snackbarId.current = enqueueSnackbar(
        "Klicka i kartan för att välja fastighet",
        { variant: "info", persist: true }
      );
    } else {
      // Hide the snackbar when draw interaction is inactivated.
      closeSnackbar(snackbarId.current);
    }
  }, [drawInteraction]);

  return (
    <>
      <InfoDialog localObserver={localObserver} />
      <Dialog open={clearDialogVisible} onClose={handleCloseConfirmationDialog}>
        <DialogTitle>{"Är du säker på att du vill rensa listan?"}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            När du rensar resultatlistan försvinner markören för respektive
            lager. Du kommer inte längre kunna se vilka lager som påverkar
            fastigheten eller vilken fastighet du fick träff på.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmationDialog}>Avbryt</Button>
          <Button onClick={handleCleanClick} autoFocus>
            Ja, rensa
          </Button>
        </DialogActions>
      </Dialog>
      {Object.keys(groupedFeatures).length === 0 && (
        <ButtonWithBottomMargin
          variant="contained"
          fullWidth={true}
          color="primary"
          onClick={handleToggleDrawClick}
        >
          {drawInteraction === "" ? "Välj fastighet" : "Avbryt"}
        </ButtonWithBottomMargin>
      )}
      {Object.keys(groupedFeatures).length > 0 && (
        <ButtonWithBottomMargin
          variant="contained"
          fullWidth={true}
          color="secondary"
          onClick={handleShowConfirmationDialog}
        >
          Rensa
        </ButtonWithBottomMargin>
      )}
      <Card sx={{ minWidth: 275 }}>
        <CardActions>
          <QuickLayerToggleButtons options={props.options} map={props.map} />
        </CardActions>
      </Card>
      {Object.keys(groupedFeatures).length > 0 &&
        Object.entries(groupedFeatures).map(([k, features], i) => (
          <PropertyItem
            key={i}
            controlledLayers={controlledLayers}
            setControlledLayers={setControlledLayers}
            startExpanded={Object.keys(groupedFeatures).length === 1} // Start with expanded by default if only one item exists}
            features={features}
            digitalPlanFeatures={digitalPlanFeatures}
            userDetails={props.app.config?.userDetails}
            olMap={props.app.map}
            clickedPointsCoordinates={clickedPointsCoordinates}
            globalObserver={globalObserver}
          />
        ))}
    </>
  );
}

export default PropertyCheckerView;
