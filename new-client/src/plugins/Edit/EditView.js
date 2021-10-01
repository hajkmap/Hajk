import React from "react";
import Toolbar from "./components/Toolbar";
import AttributeEditor from "./components/AttributeEditor";
import FormControl from "@material-ui/core/FormControl";
import FormHelperText from "@material-ui/core/FormHelperText";
import { Step, StepContent, StepLabel, Stepper } from "@material-ui/core";
import MenuItem from "@material-ui/core/MenuItem";
import InputLabel from "@material-ui/core/InputLabel";
import Grid from "@material-ui/core/Grid";
import Button from "@material-ui/core/Button";
import Select from "@material-ui/core/Select";
import SaveIcon from "@material-ui/icons/Save";
import CircularProgress from "@material-ui/core/CircularProgress";
import Typography from "@material-ui/core/Typography/Typography";

class EditView extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      sources: props.model.getSources(),
      editSource: undefined,
      editFeature: undefined,
      activeStep: 0,
      activeTool: undefined,
    };
    this.bindSubscriptions();
  }

  bindSubscriptions = () => {
    this.props.observer.subscribe("editFeature", (feature) => {
      this.props.observer.publish("feature-to-update-view", feature);
      this.setState({
        editFeature: feature,
        editSource: this.props.model.editSource,
      });
    });

    this.props.observer.subscribe("resetView", () => {
      this.props.observer.publish("feature-to-update-view", undefined);
      this.setState({
        editFeature: undefined,
        editSource: undefined,
        activeStep: 0,
        activeTool: undefined,
      });
    });
  };

  handleVectorLoadingDone = (status) => {
    this.setState({
      loading: false,
      loadingError: status === "data-load-error" ? true : false,
      activeStep: status === "data-load-error" ? 0 : 1,
    });
  };

  setLayer(serviceId) {
    this.props.model.reset();
    this.setState({
      loading: true,
    });
    this.props.model.setLayer(serviceId, this.handleVectorLoadingDone);
  }

  handlePrev = () => {
    const activeStep = this.state.activeStep - 1;
    if (activeStep === 0) {
      this.props.model.reset();
      this.setState({
        editFeature: undefined,
        editSource: undefined,
        activeStep: 0,
        activeTool: undefined,
      });
    } else {
      this.setState({ activeStep });
    }
  };

  handleNext = () => {
    const activeStep = this.state.activeStep + 1;
    this.setState({ activeStep });
  };

  toggleActiveTool = (toolName) => {
    let setTool = undefined;
    if (toolName !== this.state.activeTool) {
      setTool = toolName;
    }
    this.setState({
      activeTool: setTool,
    });
  };

  getStatusMessage = (data) => {
    if (!data) {
      return (
        <Typography>
          Uppdatateringen lyckades men det upptäcktes inte några ändringar.
        </Typography>
      );
    }
    if (data.ExceptionReport) {
      return (
        <Typography>
          Uppdateringen misslyckades:{" "}
          {data.ExceptionReport.Exception.ExceptionText.toString()}
        </Typography>
      );
    }
    if (
      data.TransactionResponse &&
      data.TransactionResponse.TransactionSummary
    ) {
      return (
        <div>
          <Typography>Uppdateringen lyckades.</Typography>
          <Typography>
            Antal skapade objekt:{" "}
            {data.TransactionResponse.TransactionSummary.totalInserted?.toString() ||
              0}
          </Typography>
          <Typography>
            Antal borttagna objekt:{" "}
            {data.TransactionResponse.TransactionSummary.totalDeleted?.toString() ||
              0}
          </Typography>
          <Typography>
            Antal uppdaterade objekt:{" "}
            {data.TransactionResponse.TransactionSummary.totalUpdated?.toString() ||
              0}
          </Typography>
        </div>
      );
    } else {
      return (
        <Typography>
          Status för uppdateringen kunde inte avläsas ur svaret från servern.
        </Typography>
      );
    }
  };

  onSaveClicked = () => {
    const { model, app } = this.props;
    model.save((response) => {
      model.filty = false;
      model.refreshEditingLayer();
      this.handleNext();
      app.globalObserver.publish("core.alert", this.getStatusMessage(response));
      this.toggleActiveTool(undefined);
      model.deactivateInteraction();
    });
  };

  renderSources() {
    const { loadingError, editSource } = this.state;
    return (
      <FormControl error={loadingError} fullWidth>
        <InputLabel id="select-source-label">Datakälla</InputLabel>
        <Select
          id="select-source"
          value={editSource?.id || ""}
          onChange={(e) => {
            this.setLayer(e.target.value);
          }}
        >
          {this.state.sources.map((source, index) => {
            return (
              <MenuItem
                key={index}
                value={source.id}
              >{`${source.caption}`}</MenuItem>
            );
          })}
        </Select>
        {loadingError && (
          <FormHelperText>
            Fel vid laddning av data. Kontakta systemadministratören.
          </FormHelperText>
        )}
      </FormControl>
    );
  }

  renderToolbar = () => {
    return (
      <Toolbar
        ref="toolbar"
        editSource={this.state.editSource}
        model={this.props.model}
        observer={this.props.observer}
        app={this.props.app}
        activeTool={this.state.activeTool}
        toggleActiveTool={(toolName) => this.toggleActiveTool(toolName)}
      />
    );
  };

  renderAttributeEditor = () => {
    const { editSource } = this.state;
    const { model, observer } = this.props;
    return (
      <AttributeEditor
        ref="attributeEditor"
        editSource={editSource}
        model={model}
        observer={observer}
        panel={this}
      />
    );
  };

  render() {
    const { activeStep, editSource, editFeature, loading } = this.state;
    return (
      <>
        <Stepper activeStep={activeStep} orientation="vertical">
          <Step key="1">
            <StepLabel>Välj datamängd att redigera</StepLabel>
            <StepContent>
              <Grid container spacing={2} direction="row">
                <Grid item xs={12}>
                  {loading ? <CircularProgress /> : this.renderSources()}
                </Grid>
              </Grid>
            </StepContent>
          </Step>
          <Step key="2">
            <StepLabel>
              {activeStep === 1
                ? `Redigerar ${editSource?.caption}`
                : `Redigera`}
            </StepLabel>
            <StepContent>
              <Grid container spacing={2} direction="row">
                <Grid item xs={12}>
                  {this.renderAttributeEditor()}
                  {this.renderToolbar()}
                </Grid>
                {!editFeature && (
                  <>
                    <Grid item xs={6}>
                      <Button
                        fullWidth
                        onClick={this.handlePrev}
                        variant="contained"
                      >
                        Bakåt
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button
                        fullWidth
                        variant="contained"
                        endIcon={<SaveIcon></SaveIcon>}
                        disabled={!editSource}
                        color="primary"
                        onClick={this.onSaveClicked}
                      >
                        Spara
                      </Button>
                    </Grid>
                  </>
                )}
              </Grid>
            </StepContent>
          </Step>
          <Step key="3">
            <StepLabel>Klart!</StepLabel>
            <StepContent>
              <Grid container spacing={2} direction="row">
                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    onClick={this.handlePrev}
                  >
                    Fortsätt redigera
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
export default EditView;
