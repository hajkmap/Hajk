import React from "react";
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
    this.setState({ distance: e.target.value });
  };

  handleNext = () => {
    // Some special handling for going from step 1 to 2:
    //  - prevent action if no features have been selected
    //  - if there are selected features, abort feature selection if user forgot to
    let isSelecting = null;
    if (this.state.activeStep === 0) {
      if (this.props.model.highlightSource.getFeatures().length === 0) {
        this.props.enqueueSnackbar(
          "Du måste markera minst ett objekt i kartan för att kunna buffra",
          {
            variant: "error",
          }
        );
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
        l = "Buffra";
        break;
      case 2:
        l = "Börja om";
        break;
      default:
        l = "Nästa";
        break;
    }
    return l;
  };

  renderPrevButton = () => {
    return (
      <Grid item xs={6}>
        <Button
          fullWidth
          disabled={this.state.activeStep === 0}
          onClick={this.handlePrev}
        >
          Föregående
        </Button>
      </Grid>
    );
  };

  renderClearButton = () => {
    return (
      (this.model.highlightSource.getFeatures().length !== 0 ||
        this.model.bufferSource.getFeatures().length !== 0) && (
        <Grid item xs={12}>
          <Button
            fullWidth
            onClick={() => {
              this.model.clear();
              // The clear() above didn't cause any changes to this components
              // state, hence we must force update… sorry! :/
              this.forceUpdate();
            }}
          >
            <ClearIcon /> Rensa
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
            <StepLabel>Välj objekt att buffra</StepLabel>
            <StepContent>
              <Grid container spacing={2} direction="row">
                {this.renderClearButton()}
                <Grid item xs={12}>
                  <HajkToolTip title="Markera flera objekt">
                    <StyledToggleButton
                      onChange={this.setSelecting}
                      selected={this.state.isSelecting}
                      value="isSelecting"
                    >
                      <AddIcon />
                      Välj objekt
                    </StyledToggleButton>
                  </HajkToolTip>
                </Grid>
                {this.renderPrevButton()}
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    onClick={this.handleNext}
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
                    value={this.state.distance}
                    onChange={this.setDistance}
                    label="Bufferavstånd (i meter)"
                  />
                </Grid>
                {this.renderPrevButton()}
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    onClick={() => {
                      this.handleNext();
                      this.props.model.bufferFeatures(this.state.distance);
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
                {this.renderPrevButton()}
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    onClick={() => {
                      this.props.model.clear();
                      this.setState({ activeStep: 0 });
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
  }
}

export default withSnackbar(BufferView);
