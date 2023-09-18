// Make sure to only import the hooks you intend to use
import React, { useEffect, useState } from "react";

import { styled } from "@mui/material/styles";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Card,
  CardActions,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import { useSnackbar } from "notistack";

// import useCookieStatus from "hooks/useCookieStatus";

import FeatureItem from "./views/FeatureItem.js";
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

  const { enqueueSnackbar } = useSnackbar();

  const [groupedFeatures, setGroupedFeatures] = useState({});

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
    drawModel.removeDrawnFeatures();
  };

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
    const handleNewGetFeatureInfoFeatures = (groupedFeatures) => {
      setGroupedFeatures(groupedFeatures);
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

  return (
    <>
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
        <React.Fragment>
          <ButtonWithBottomMargin
            variant="contained"
            fullWidth={true}
            color="primary"
            onClick={handleToggleDrawClick}
          >
            {drawInteraction === "" ? "Välj fastighet" : "Avbryt"}
          </ButtonWithBottomMargin>
        </React.Fragment>
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
          <React.Fragment key={i}>
            <Accordion
              defaultExpanded={Object.keys(groupedFeatures).length === 1} // Start with expanded by default if only one item exists
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>
                  {features.markerFeature.get("fastighet")}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography sx={{ color: "text.secondary" }}>
                  {features.features.length} lager påverkar fastigheten
                </Typography>
                <Divider />
                {features.features.map((f, j) => (
                  <FeatureItem
                    clickedPointsCoordinates={clickedPointsCoordinates}
                    feature={f}
                    key={j}
                    olMap={props.app.map}
                    globalObserver={globalObserver}
                  />
                ))}
              </AccordionDetails>
            </Accordion>
          </React.Fragment>
        ))}
    </>
  );
}

export default PropertyCheckerView;
