import React, { useState, useEffect } from "react";
import { styled } from "@mui/material/styles";
import Grid from "@mui/material/Grid";
import AddIcon from "@mui/icons-material/AddBox";
import ClearIcon from "@mui/icons-material/LayersClear";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import ToggleButton from "@mui/material/ToggleButton";
import { Step, StepContent, StepLabel, Stepper } from "@mui/material";
import { withSnackbar } from "notistack";
import HajkToolTip from "components/HajkToolTip";

const StyledToggleButton = styled(ToggleButton)(({ theme }) => ({
  width: "100%",
  paddingTop: 5,
  paddingBottom: 5,
  color: theme.palette.text.primary,
  backgroundColor: theme.palette.primary,
}));

const BufferView = (props) => {
  const [name, setName] = useState("");
  const [isSelecting, setIsSelecting] = useState(false);
  const [distance, setDistance] = useState(1000);
  const [activeStep, setActiveStep] = useState(0);

  const model = props.model;
  const app = props.app;
  const globalObserver = props.app.globalObserver;

  useEffect(() => {
    const resetViewHandler = () => {
      setActiveStep(0);
      setIsSelecting(false);
    };

    props.localObserver.subscribe("resetView", resetViewHandler);

    // Cleanup subscription on unmount
    return () => {
      props.localObserver.unsubscribe("resetView", resetViewHandler);
    };
  }, [props.localObserver]);

  const handleToggleSelecting = () => {
    setIsSelecting((prevIsSelecting) => {
      const newIsSelecting = !prevIsSelecting;
      model.activateSelecting(newIsSelecting);
      return newIsSelecting;
    });
  };

  const handleDistanceChange = (e) => {
    setDistance(e.target.value);
  };

  const handleNext = () => {
    if (activeStep === 0) {
      if (model.highlightSource.getFeatures().length === 0) {
        props.enqueueSnackbar(
          "Du måste markera minst ett objekt i kartan för att kunna buffra",
          { variant: "error" }
        );
        return;
      }
      model.activateSelecting(false);
      setIsSelecting(false);
    }
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handlePrev = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const getNextButtonLabel = () => {
    switch (activeStep) {
      case 1:
        return "Buffra";
      case 2:
        return "Börja om";
      default:
        return "Nästa";
    }
  };

  const renderPrevButton = () => (
    <Grid item xs={6}>
      <Button fullWidth disabled={activeStep === 0} onClick={handlePrev}>
        Föregående
      </Button>
    </Grid>
  );

  const renderClearButton = () =>
    (model.highlightSource.getFeatures().length !== 0 ||
      model.bufferSource.getFeatures().length !== 0) && (
      <Grid item xs={12}>
        <Button
          fullWidth
          onClick={() => {
            model.clear();
            // Force update
            setName(name + " ");
          }}
        >
          <ClearIcon /> Rensa
        </Button>
      </Grid>
    );

  return (
    <>
      <Stepper activeStep={activeStep} orientation="vertical">
        <Step key="1">
          <StepLabel>Välj objekt att buffra</StepLabel>
          <StepContent>
            <Grid container spacing={2} direction="row">
              {renderClearButton()}
              <Grid item xs={12}>
                <HajkToolTip title="Markera flera objekt">
                  <StyledToggleButton
                    onChange={handleToggleSelecting}
                    selected={isSelecting}
                    value="isSelecting"
                  >
                    <AddIcon />
                    Välj objekt
                  </StyledToggleButton>
                </HajkToolTip>
              </Grid>
              {renderPrevButton()}
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  onClick={handleNext}
                >
                  Nästa
                </Button>
              </Grid>
            </Grid>
          </StepContent>
        </Step>
        <Step key="2">
          <StepLabel>Ange bufferavstånd</StepLabel>
          <StepContent>
            <Grid container spacing={2} direction="row">
              <Grid item xs={12}>
                <TextField
                  variant="outlined"
                  fullWidth
                  value={distance}
                  onChange={handleDistanceChange}
                  label="Bufferavstånd (i meter)"
                />
              </Grid>
              {renderPrevButton()}
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  onClick={() => {
                    handleNext();
                    model.bufferFeatures(distance);
                  }}
                >
                  Buffra
                </Button>
              </Grid>
            </Grid>
          </StepContent>
        </Step>
        <Step key="3">
          <StepLabel>Klart</StepLabel>
          <StepContent>
            <Grid container spacing={2} direction="row">
              {renderPrevButton()}
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  onClick={() => {
                    model.clear();
                    setActiveStep(0);
                  }}
                >
                  Rensa
                </Button>
              </Grid>
            </Grid>
          </StepContent>
        </Step>
      </Stepper>
    </>
  );
};

export default withSnackbar(BufferView);
