import React from "react";
import { styled } from "@mui/material/styles";

import Grid from "@mui/material/Grid";
import AddIcon from "@mui/icons-material/AddBox";
import ClearIcon from "@mui/icons-material/LayersClear";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import ToggleButton from "@mui/material/ToggleButton";
import { Step, StepContent, StepLabel, Stepper } from "@mui/material";
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

class BufferView extends React.PureComponent {
  state = {
    name: "",
    isSelecting: false,
    distance: 1000,
    activeStep: 0,
  };

  constructor(props) {
    super(props);

    this.model = this.props.model;
    this.app = this.props.app;
    this.globalObserver = this.props.app.globalObserver;
    this.props.localObserver.subscribe("resetView", () => {
      this.setState({ activeStep: 0, isSelecting: false });
    });
  }

  setSelecting = () => {
    this.setState({ isSelecting: !this.state.isSelecting }, () => {
      this.props.model.activateSelecting(this.state.isSelecting);
    });
  };

  setDistance = (e) => {
    const value = e.target.value;
    // Allow empty value, integers, or decimals like "123.456" or "123,456"
    if (value === "" || /^\d+(?:[.,]\d*)?$/.test(value)) {
      this.setState({ distance: value });
    }
  };

  handleNext = () => {
    // Some special handling for going from step 1 to 2:
    //  - prevent action if no features have been selected
    //  - if there are selected features, abort feature selection if user forgot to
    let isSelecting = null;
    if (this.state.activeStep === 0) {
      if (this.props.model.highlightSource.getFeatures().length === 0) {
        this.props.enqueueSnackbar(i18n.t("buffer.selectAtLeastOne"), {
          variant: "error",
        });
        return;
      }
      this.props.model.activateSelecting(false);
      isSelecting = false; // Prepare the state variable for setting later
    }

    const activeStep = this.state.activeStep + 1;
    this.setState({
      activeStep, // Always set active step to current (new) value
      ...(isSelecting !== null && { isSelecting }), // Set isSelecting only if it isn't null
    });
  };

  handlePrev = () => {
    const activeStep = this.state.activeStep - 1;
    this.setState({ activeStep });
  };

  getNextButtonLabel = () => {
    let l = null;
    switch (this.state.activeStep) {
      case 1:
        l = i18n.t("buffer.buffer");
        break;
      case 2:
        l = i18n.t("buffer.startOver");
        break;
      default:
        l = i18n.t("common.next");
        break;
    }
    return l;
  };

  renderPrevButton = () => {
    return (
      <Grid size={6}>
        <Button
          fullWidth
          disabled={this.state.activeStep === 0}
          onClick={this.handlePrev}
        >
          {i18n.t("common.previous")}
        </Button>
      </Grid>
    );
  };

  renderClearButton = () => {
    return (
      (this.model.highlightSource.getFeatures().length !== 0 ||
        this.model.bufferSource.getFeatures().length !== 0) && (
        <Grid size={12}>
          <Button
            fullWidth
            onClick={() => {
              this.model.clear();
              // The clear() above didn't cause any changes to this components
              // state, hence we must force update… sorry! :/
              this.forceUpdate();
            }}
          >
            <ClearIcon /> {i18n.t("common.clear")}
          </Button>
        </Grid>
      )
    );
  };

  render() {
    return (
      <>
        <Stepper activeStep={this.state.activeStep} orientation="vertical">
          <Step key="1">
            <StepLabel>{i18n.t("buffer.steps.select")}</StepLabel>
            <StepContent>
              <Grid container spacing={2} direction="row">
                {this.renderClearButton()}
                <Grid size={12}>
                  <HajkToolTip title={i18n.t("buffer.selectMultiple")}>
                    <StyledToggleButton
                      onChange={this.setSelecting}
                      selected={this.state.isSelecting}
                      value="isSelecting"
                    >
                      <AddIcon />
                      {i18n.t("buffer.selectFeatures")}
                    </StyledToggleButton>
                  </HajkToolTip>
                </Grid>
                {this.renderPrevButton()}
                <Grid size={6}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    onClick={this.handleNext}
                  >
                    {i18n.t("common.next")}
                  </Button>
                </Grid>
              </Grid>
            </StepContent>
          </Step>
          <Step key="2">
            <StepLabel>{i18n.t("buffer.steps.distance")}</StepLabel>
            <StepContent>
              <Grid container spacing={2} direction="row">
                <Grid size={12}>
                  <TextField
                    variant="outlined"
                    fullWidth
                    value={this.state.distance}
                    onChange={this.setDistance}
                    label={i18n.t("buffer.distanceLabel")}
                  />
                </Grid>
                {this.renderPrevButton()}
                <Grid size={6}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    onClick={() => {
                      this.handleNext();
                      this.props.model.bufferFeatures(this.state.distance);
                    }}
                  >
                    {i18n.t("buffer.buffer")}
                  </Button>
                </Grid>
              </Grid>
            </StepContent>
          </Step>
          <Step key="3">
            <StepLabel>{i18n.t("buffer.steps.done")}</StepLabel>
            <StepContent>
              <Grid container spacing={2} direction="row">
                {this.renderPrevButton()}
                <Grid size={6}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    onClick={() => {
                      this.props.model.clear();
                      this.setState({ activeStep: 0 });
                    }}
                  >
                    {i18n.t("common.clear")}
                  </Button>
                </Grid>
              </Grid>
            </StepContent>
          </Step>
        </Stepper>
      </>
    );
  }
}

export default withSnackbar(BufferView);
