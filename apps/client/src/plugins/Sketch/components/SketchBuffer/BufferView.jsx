import { useEffect, useCallback, useMemo } from "react";
import { styled } from "@mui/material/styles";
import Grid from "@mui/material/Grid";
import AddIcon from "@mui/icons-material/AddBox";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import ClearIcon from "@mui/icons-material/LayersClear";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import ToggleButton from "@mui/material/ToggleButton";
import { Step, StepContent, StepLabel, Stepper } from "@mui/material";
import { useSnackbar } from "notistack";
import withSnackbar from "components/WithSnackbar";
import HajkToolTip from "components/HajkToolTip";
import i18n from "src/i18n";

const StyledToggleButton = styled(ToggleButton)(({ theme }) => ({
  width: "100%",
  paddingTop: 5,
  paddingBottom: 5,
  color: theme.palette.text.primary,
  backgroundColor: theme.palette.primary,
}));

// This is the view for the buffer sketch plugin.
// It almost contains the same logic as the BufferView.js for the Buffer plugin, with some minimal changes.
const BufferView = (props) => {
  const {
    drawModel,
    model,
    localObserver,
    setToggleBufferBtn,
    toggleBufferBtn,
    setState,
    state,
  } = props;
  const { enqueueSnackbar } = useSnackbar();
  const contextValue = useMemo(() => ({ state, setState }), [state, setState]);

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
        setToggleBufferBtn({ ...toggleBufferBtn, toggle: true });
      } else {
        setToggleBufferBtn({ ...toggleBufferBtn, toggle: false });
      }

      return nextState;
    });
    model.activateSelecting(!contextValue.state.isSelecting);
  };

  const setDistance = (e) => {
    contextValue.setState((prevState) => ({
      ...prevState,
      distance: e.target.value,
    }));
  };

  const handleNext = () => {
    if (contextValue.state.activeStep === 0) {
      if (state.highlightSource.getFeatures().length === 0) {
        enqueueSnackbar(i18n.t("sketch.buffer.selectAtLeastOne"), {
          variant: "error",
        });
        return;
      }
      model.activateSelecting(false);
    }

    const activeStep = contextValue.state.activeStep + 1;
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
        label = i18n.t("sketch.buffer.buffer");
        break;
      case 2:
        label = i18n.t("sketch.buffer.restart");
        break;
      default:
        label = i18n.t("common.next");
        break;
    }
    return label;
  };

  const renderPrevButton = () => {
    return (
      <Grid size={6}>
        <Button
          fullWidth
          disabled={contextValue.state.activeStep === 0}
          onClick={handlePrev}
        >
          {i18n.t("common.previous")}
        </Button>
      </Grid>
    );
  };

  const renderClearButton = () => {
    return (
      (state.highlightSource.getFeatures().length !== 0 ||
        drawModel
          ?.getAllDrawnFeatures()
          ?.filter((f) => f?.get("bufferedFeature")).length !== 0) && (
        <Grid size={12}>
          <Button
            fullWidth
            onClick={() => {
              model.clear();
              contextValue.setState((prevState) => ({ ...prevState }));
            }}
          >
            <ClearIcon /> {i18n.t("search.results.clear")}
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
          <StepLabel>{i18n.t("sketch.buffer.selectStep")}</StepLabel>
          <StepContent>
            <Grid container spacing={2} direction="row">
              {renderClearButton()}
              <Grid size={12}>
                <HajkToolTip
                  title={
                    !toggleBufferBtn.toggle
                      ? i18n.t("sketch.buffer.clickToDraw")
                      : i18n.t("sketch.buffer.clickToSelect")
                  }
                >
                  <StyledToggleButton
                    onChange={setSelecting}
                    selected={contextValue.state.isSelecting}
                    value="isSelecting"
                  >
                    {!toggleBufferBtn.toggle ? (
                      <>
                        <RemoveCircleIcon />{" "}
                        <Box sx={{ mt: 0.4, ml: 0.2 }}>
                          {i18n.t("sketch.buffer.turnOff")}
                        </Box>
                      </>
                    ) : (
                      <>
                        <AddIcon />
                        <Box sx={{ mt: 0.4, ml: 0.2 }}>
                          {i18n.t("sketch.buffer.selectObjects")}
                        </Box>
                      </>
                    )}
                  </StyledToggleButton>
                </HajkToolTip>
              </Grid>
              {renderPrevButton()}
              <Grid size={6}>
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
          <StepLabel>{i18n.t("sketch.buffer.distanceStep")}</StepLabel>
          <StepContent>
            <Grid container spacing={2} direction="row">
              <Grid size={12}>
                <TextField
                  variant="outlined"
                  fullWidth
                  value={contextValue.state.distance}
                  onChange={setDistance}
                  label={i18n.t("sketch.buffer.distance")}
                />
              </Grid>
              {renderPrevButton()}
              <Grid size={6}>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  onClick={() => {
                    handleNext();
                    model.highlightLayer.setZIndex(1000);
                    model.bufferFeatures(contextValue.state.distance);
                  }}
                >
                  {i18n.t("sketch.buffer.buffer")}
                </Button>
              </Grid>
            </Grid>
          </StepContent>
        </Step>
        <Step key="3">
          <StepLabel>{i18n.t("sketch.buffer.done")}</StepLabel>
          <StepContent>
            <Grid container spacing={2} direction="row">
              {renderPrevButton()}
              <Grid size={6}>
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
                  {i18n.t("search.results.clear")}
                </Button>
              </Grid>
              <Grid size={12}>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  onClick={() => {
                    contextValue.setState((prevState) => ({
                      ...prevState,
                      activeStep: 0,
                    }));
                    setToggleBufferBtn({
                      ...toggleBufferBtn,
                      toggle: true,
                    });
                    contextValue.setState((prevState) => ({
                      ...prevState,
                      isSelecting: false,
                    }));
                    state.highlightSource.clear();
                  }}
                >
                  {i18n.t("sketch.buffer.restart")}
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
