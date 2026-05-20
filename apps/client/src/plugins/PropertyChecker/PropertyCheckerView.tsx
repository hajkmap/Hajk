// Make sure to only import the hooks you intend to use
import { useEffect, useRef, useState } from "react";

import useUpdateEffect from "../../hooks/useUpdateEffect";

import BaseDialog from "components/Dialog/BaseDialog";
import HajkToolTip from "components/HajkToolTip";
import {
  Alert,
  Button,
  Card,
  CardActions,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import { PropertyCheckerContext } from "./context";

import { type SnackbarKey, useSnackbar } from "notistack";

// import useCookieStatus from "hooks/useCookieStatus";

import InfoDialog from "./views/InfoDialog";
import PropertyItem from "./views/PropertyItem";
import QuickLayerToggleButtons from "./views/QuickLayerToggleButtons";

import type Feature from "ol/Feature";
import type SimpleGeometry from "ol/geom/SimpleGeometry";
import type {
  PropertyCheckerViewProps,
  GroupedFeatures,
  GroupedDigitalPlanFeatures,
  GetFeatureInfoPayload,
  NoFeaturesPayload,
  ControlledLayer,
} from "./types";

const ButtonWithBottomMargin = styled(Button)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

function PropertyCheckerView(props: PropertyCheckerViewProps) {
  const {
    drawModel,
    globalObserver,
    localObserver,
    drawInteraction,
    setDrawInteraction,
  } = props;

  const enableCheckLayerTab = props.options.enableCheckLayerTab !== false;
  const enableDigitalPlansTab = props.options.enableDigitalPlansTab !== false;

  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const snackbarId = useRef<SnackbarKey | undefined>(undefined);

  const [groupedFeatures, setGroupedFeatures] = useState<GroupedFeatures>({});
  const [digitalPlanFeatures, setDigitalPlanFeatures] =
    useState<GroupedDigitalPlanFeatures>({});

  // We want to keep track of the clicked point's coordinates, to be able
  // to pass them down to child components.
  const [clickedPointsCoordinates, setClickedPointsCoordinates] = useState<
    number[]
  >([]);

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
    setDigitalPlanFeatures({});
    drawModel.removeDrawnFeatures();
  };

  const [controlledLayers, setControlledLayers] = useState<ControlledLayer[]>(
    []
  );

  // Subscribe and unsubscribe to events
  useEffect(() => {
    // Triggered when a feature is added to the Draw Model (in this case: when
    // user clicks a point on the map). We want to know when this happens so that
    // we can a) disable the draw interaction and b) grab the coordinates of the
    // clicked point.
    const handleFeatureAdded = (feature: Feature) => {
      setDrawInteraction("");
      setClickedPointsCoordinates(
        (feature.getGeometry() as SimpleGeometry).getFlatCoordinates()
      );
    };

    // This runs when our model has successfully fetched features and there's
    // at least one result.
    const handleNewGetFeatureInfoFeatures = ({
      digitalPlanFeatures,
      groupedFeatures,
    }: GetFeatureInfoPayload) => {
      setGroupedFeatures(groupedFeatures);
      setDigitalPlanFeatures(digitalPlanFeatures);
    };

    // Sometimes we won't get a result for the clicked point, but we still want
    // to inform the user about it. We should also remove the clicked point feature
    // from map, otherwise we'd end up with multiple points as user clicks next time.
    const handleNoFeaturesInResult = ({
      amountOfProperties,
      amountOfDigitalPlans,
    }: NoFeaturesPayload) => {
      drawModel.removeDrawnFeatures();
      if (enableCheckLayerTab && amountOfProperties === 0) {
        enqueueSnackbar(
          "Den klickade fastigheten gav inga träffar i Fastighetskontrollens databas",
          { variant: "info" }
        );
      } else if (enableCheckLayerTab && amountOfProperties > 1) {
        enqueueSnackbar(
          "Du klickade på fler än en fastighet. Vänligen prova igen. Tips: slå på fastighetsgränser och håll dig en bit från gränsen när du klickar.",
          { variant: "warning" }
        );
      } else if (enableDigitalPlansTab && amountOfDigitalPlans > 1) {
        enqueueSnackbar(
          "Du klickade på fler än en detaljplan. Vänligen prova igen. Tips: slå på detaljplaner och titta var gränserna går. Håll dig en bit från gränsen när du klickar.",
          { variant: "warning" }
        );
      }
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
  }, [
    drawModel,
    enableCheckLayerTab,
    enableDigitalPlansTab,
    enqueueSnackbar,
    localObserver,
    setDrawInteraction,
  ]);

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

  const showTooltips = props.showTooltips;

  return (
    <PropertyCheckerContext.Provider value={{ showTooltips }}>
      <InfoDialog localObserver={localObserver} />
      <BaseDialog
        open={clearDialogVisible}
        onClose={handleCloseConfirmationDialog}
      >
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
          <Button onClick={handleCleanClick}>Ja, rensa</Button>
        </DialogActions>
      </BaseDialog>
      {!enableCheckLayerTab && !enableDigitalPlansTab && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Verktyget är felinställt: varken lagerflik eller planflik är
          aktiverad. Kontakta systemadministratören.
        </Alert>
      )}
      {(enableCheckLayerTab
        ? Object.keys(groupedFeatures).length === 0
        : Object.keys(digitalPlanFeatures).length === 0) && (
        <HajkToolTip
          title={
            showTooltips
              ? drawInteraction === ""
                ? "Klicka i kartan för att välja en fastighet"
                : "Avbryt val av fastighet"
              : ""
          }
        >
          <ButtonWithBottomMargin
            variant="contained"
            fullWidth={true}
            color="primary"
            onClick={handleToggleDrawClick}
            disabled={!enableCheckLayerTab && !enableDigitalPlansTab}
          >
            {drawInteraction === "" ? "Välj fastighet" : "Avbryt"}
          </ButtonWithBottomMargin>
        </HajkToolTip>
      )}
      {(enableCheckLayerTab
        ? Object.keys(groupedFeatures).length > 0
        : Object.keys(digitalPlanFeatures).length > 0) && (
        <HajkToolTip
          title={
            showTooltips ? "Rensa resultatlistan och ta bort markören" : ""
          }
        >
          <ButtonWithBottomMargin
            variant="contained"
            fullWidth={true}
            color="secondary"
            onClick={handleShowConfirmationDialog}
          >
            Rensa
          </ButtonWithBottomMargin>
        </HajkToolTip>
      )}
      <Card sx={{ minWidth: 275, mb: 2 }}>
        <CardActions>
          <QuickLayerToggleButtons options={props.options} map={props.map} />
        </CardActions>
      </Card>
      {enableCheckLayerTab &&
        Object.keys(groupedFeatures).length > 0 &&
        Object.entries(groupedFeatures).map(([_k, features], i) => (
          <PropertyItem
            clickedPointsCoordinates={clickedPointsCoordinates}
            controlledLayers={controlledLayers}
            digitalPlanFeatures={digitalPlanFeatures}
            features={features}
            globalObserver={globalObserver}
            key={i}
            olMap={props.app.map}
            options={props.options}
            setControlledLayers={setControlledLayers}
            startExpanded={Object.keys(groupedFeatures).length === 1}
            userDetails={props.app.config?.userDetails}
          />
        ))}
      {!enableCheckLayerTab &&
        Object.keys(digitalPlanFeatures).length > 0 &&
        Object.entries(digitalPlanFeatures).map(([planKey, planEntry], i) => (
          <PropertyItem
            clickedPointsCoordinates={clickedPointsCoordinates}
            controlledLayers={controlledLayers}
            digitalPlanFeatures={digitalPlanFeatures}
            features={{ markerFeature: planEntry.markerFeature, features: [] }}
            globalObserver={globalObserver}
            key={i}
            olMap={props.app.map}
            options={props.options}
            setControlledLayers={setControlledLayers}
            startExpanded={Object.keys(digitalPlanFeatures).length === 1}
            title={planKey}
            userDetails={props.app.config?.userDetails}
          />
        ))}
    </PropertyCheckerContext.Provider>
  );
}

export default PropertyCheckerView;
