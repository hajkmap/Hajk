import React, { useEffect, useCallback } from "react";
import { styled } from "@mui/material/styles";
import Grid from "@mui/material/Grid";
import AddIcon from "@mui/icons-material/AddBox";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import ClearIcon from "@mui/icons-material/LayersClear";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import ToggleButton from "@mui/material/ToggleButton";
import Tooltip from "@mui/material/Tooltip";
import { Step, StepContent, StepLabel, Stepper } from "@mui/material";
import { withSnackbar, useSnackbar } from "notistack";
import { useSketchLayer } from "plugins/Sketch/SketchContext";

const StyledToggleButton = styled(ToggleButton)(({ theme }) => ({
  width: "100%",
  paddingTop: 5,
  paddingBottom: 5,
  color: theme.palette.text.primary,
  backgroundColor: theme.palette.primary,
}));

const BufferView = (props) => {
  const { model, localObserver, setToggleObjectButton } = props;
  const { contextValue } = useSketchLayer();
  const { enqueueSnackbar } = useSnackbar();

  const handleResetViews = useCallback(() => {
    return () => {
      contextValue.setState((prevState) => ({ ...prevState, activeStep: 0 }));
    };
  }, [contextValue]);

  useEffect(() => {
    localObserver.subscribe("resetViews", handleResetViews);
  }, [localObserver, handleResetViews]);

  const setSelecting = () => {
    contextValue.setState((prevState) => {
      const nextState = {
        ...prevState,
        isSelecting: !prevState.isSelecting,
      };
      if (!nextState.isSelecting) {
        setToggleObjectButton(true);
      } else {
        setToggleObjectButton(false);
      }

      return nextState;
    });
  };

  const setDistance = (e) => {
    contextValue.setState((prevState) => ({
      ...prevState,
      distance: e.target.value,
    }));
  };

  const handleNext = () => {
    if (contextValue.state.activeStep === 0) {
      if (model.highlightSource.getFeatures().length === 0) {
        enqueueSnackbar(
          "Du måste markera minst ett objekt i kartan för att kunna buffra",
          {
            variant: "error",
          }
        );
        return;
      }
      model.activateSelecting(false);
    }

    const activeStep = contextValue.state.activeStep + 1;
    setToggleObjectButton(false);
    contextValue.setState((prevState) => ({
      ...prevState,
      activeStep,
      isSelecting: prevState.isSelecting,
    }));
  };

  const handlePrev = () => {
    const activeStep = contextValue.state.activeStep - 1;
    contextValue.setState((prevState) => ({ ...prevState, activeStep }));
  };

  const getNextButtonLabel = () => {
    let label = null;
    switch (contextValue.state.activeStep) {
      case 1:
        label = "Buffra";
        break;
      case 2:
        label = "Börja om";
        break;
      default:
        label = "Nästa";
        break;
    }
    return label;
  };

  const renderPrevButton = () => {
    return (
      <Grid item xs={6}>
        <Button
          fullWidth
          disabled={contextValue.state.activeStep === 0}
          onClick={handlePrev}
        >
          Föregående
        </Button>
      </Grid>
    );
  };

  const renderClearButton = () => {
    return (
      (model.highlightSource.getFeatures().length !== 0 ||
        model.bufferSource.getFeatures().length !== 0) && (
        <Grid item xs={12}>
          <Button
            fullWidth
            onClick={() => {
              model.clear();
              contextValue.setState((prevState) => ({ ...prevState }));
            }}
          >
            <ClearIcon /> Rensa
          </Button>
        </Grid>
      )
    );
  };
  return (
    <>
      <Stepper
        activeStep={contextValue.state.activeStep}
        orientation="vertical"
      >
        <Step key="1">
          <StepLabel>Välj objekt att buffra</StepLabel>
          <StepContent>
            <Grid container spacing={2} direction="row">
              {renderClearButton()}
              <Grid item xs={12}>
                <Tooltip title="Markera flera objekt">
                  <StyledToggleButton
                    onChange={setSelecting}
                    selected={contextValue.state.isSelecting}
                    value="isSelecting"
                  >
                    {contextValue.state.isSelecting ? (
                      <>
                        <RemoveCircleIcon />{" "}
                        <Box sx={{ mt: 0.4, ml: 0.2 }}>Avvisa</Box>
                      </>
                    ) : (
                      <>
                        <AddIcon />
                        <Box sx={{ mt: 0.4, ml: 0.2 }}>Välj objekt</Box>
                      </>
                    )}
                  </StyledToggleButton>
                </Tooltip>
              </Grid>
              {renderPrevButton()}
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  onClick={() => handleNext()}
                >
                  {getNextButtonLabel()}
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
                  value={contextValue.state.distance}
                  onChange={setDistance}
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
                    model.bufferFeatures(contextValue.state.distance);
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
                    contextValue.setState((prevState) => ({
                      ...prevState,
                      activeStep: 0,
                    }));
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
