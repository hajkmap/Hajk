import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import {
  TextField,
  Button,
  Typography,
  Divider,
  Grid,
  FormControl,
  Checkbox,
  FormControlLabel,
} from "@material-ui/core";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import InactivePolygon from "../img/polygonmarkering.png";
import InactiveRectangle from "../img/rektangelmarkering.png";
import ActivePolygon from "../img/polygonmarkering-blue.png";
import ActiveRectangle from "../img/rektangelmarkering-blue.png";

// Define JSS styles that will be used in this component.
// Example below utilizes the very powerful "theme" object
// that gives access to some constants, see: https://material-ui.com/customization/default-theme/

const styles = (theme) => ({
  searchButton: { marginTop: 8, borderColor: theme.palette.primary.main },
  divider: { marginTop: theme.spacing(3), marginBottom: theme.spacing(3) },
  textFields: { marginLeft: 10 },
  fontSize: { fontSize: 12 },
  polygonAndRectangle: {
    marginLeft: 10,
  },
  firstMenuItem: { minHeight: 36 },
  searchButtonText: { color: theme.palette.primary.main },
  showLinesCheckbox: { marginLeft: 8, marginTop: 6 },
});

//TODO - Only mockup //Tobias

class Lines extends React.PureComponent {
  // Initialize state - this is the correct way of doing it nowadays.
  state = {
    publicLineName: "",
    internalLineNumber: "",
    municipalities: [],
    municipality: "",
    trafficTransports: [],
    trafficTransport: "",
    throughStopArea: "",
    showStopAreas: false,
  };

  // propTypes and defaultProps are static properties, declared
  // as high as possible within the component code. They should
  // be immediately visible to other devs reading the file,
  // since they serve as documentation.
  static propTypes = {
    model: PropTypes.object.isRequired,
    app: PropTypes.object.isRequired,
    localObserver: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
  };

  static defaultProps = {};

  constructor(props) {
    // If you're not using some of properties defined below, remove them from your code.
    // They are shown here for demonstration purposes only.
    super(props);
    this.model = this.props.model;
    this.localObserver = this.props.localObserver;
    this.globalObserver = this.props.app.globalObserver;
    this.bindSubscriptions();
    this.model.fetchAllPossibleMunicipalityZoneNames().then((result) => {
      this.setState({
        municipalities: result?.length > 0 ? result : [],
      });
      this.model.fetchAllPossibleTransportModeTypeNames().then((result) => {
        this.setState({
          trafficTransports: result.length > 0 ? result : [],
        });
      });
    });
  }

  togglePolygonState = () => {
    this.setState({ isPolygonActive: !this.state.isPolygonActive }, () => {
      this.handlePolygonClick();
    });
  };
  toggleRectangleState = () => {
    this.setState({ isRectangleActive: !this.state.isRectangleActive }, () => {
      this.handleRectangleClick();
    });
  };
  bindSubscriptions() {
    const { localObserver } = this.props;
    localObserver.subscribe("vt-result-done", () => {
      this.clearSearchInputAndButtons();
    });
  }
  /**
   * Method that in actives all search inputs and both spatial buttons.
   *
   * @memberof Lines
   */
  inactivateSpatialSearchButtons = () => {
    this.setState({ isPolygonActive: false, isRectangleActive: false });
  };

  clearSearchInputAndButtons = () => {
    this.setState({
      publicLineName: "",
      internalLineNumber: "",
      municipality: "",
      trafficTransport: "",
      throughStopArea: "",
      showStopAreas: false,
    });
  };

  doSearch = () => {
    const {
      publicLineName,
      internalLineNumber,
      municipality,
      trafficTransport,
      throughStopArea,
    } = this.state;
    this.localObserver.publish("vt-routes-search", {
      publicLineName: publicLineName,
      internalLineNumber: internalLineNumber,
      municipality: municipality.gid,
      trafficTransport: trafficTransport,
      throughStopArea: throughStopArea,
      selectedFormType: "",
      searchCallback: this.clearSearchInputAndButtons,
    });
  };

  #handleCheckBoxClick = (event) => {
    this.setState({
      showStopAreas: event.target.checked,
    });
    this.localObserver.publish("vt-show-stop-points-by-line", {
      showStopPoints: event.target.checked,
    });
  };

  handlePolygonClick = () => {
    const {
      publicLineName,
      internalLineNumber,
      municipality,
      trafficTransport,
      throughStopArea,
    } = this.state;
    if (!this.state.isPolygonActive) {
      this.localObserver.publish("vt-activate-search", () => {});
    }
    if (this.state.isPolygonActive || this.state.isRectangleActive) {
      this.localObserver.publish("vt-deactivate-search", () => {});
      this.setState({ isRectangleActive: false });
    }
    if (this.state.isPolygonActive) {
      this.localObserver.publish("vt-routes-search", {
        publicLineName: publicLineName,
        internalLineNumber: internalLineNumber,
        municipality: municipality.gid,
        trafficTransport: trafficTransport,
        throughStopArea: throughStopArea,
        selectedFormType: "Polygon",
        searchCallback: this.inactivateSpatialSearchButtons,
      });
    }
  };

  handleRectangleClick = () => {
    const {
      publicLineName,
      internalLineNumber,
      municipality,
      trafficTransport,
      throughStopArea,
    } = this.state;
    if (!this.state.isRectangleActive) {
      this.localObserver.publish("vt-activate-search", () => {});
    }
    if (this.state.isRectangleActive || this.state.isPolygonActive) {
      this.localObserver.publish("vt-deactivate-search", () => {});
      this.setState({ isPolygonActive: false });
    }
    if (this.state.isRectangleActive) {
      this.localObserver.publish("vt-routes-search", {
        publicLineName: publicLineName,
        internalLineNumber: internalLineNumber,
        municipality: municipality.gid,
        trafficTransportName: trafficTransport,
        throughStopArea: throughStopArea,
        selectedFormType: "Box",
        searchCallback: this.inactivateSpatialSearchButtons,
      });
    }
  };

  handleInternalLineNrChange = (event) => {
    this.setState({
      internalLineNumber: event.target.value,
    });
  };

  handlePublicLineNameChange = (event) => {
    this.setState({
      publicLineName: event.target.value,
    });
  };

  handleMunicipalChange = (e) => {
    this.setState({
      municipality: e.target.value,
    });
  };

  handleTrafficTransportChange = (e) => {
    this.setState({
      trafficTransport: e.target.value,
    });
  };

  handleThroughStopAreaChange = (event) => {
    this.setState({
      throughStopArea: event.target.value,
    });
  };

  #handleKeyPress = (event) => {
    if (event.key === "Enter") {
      this.doSearch();
    }
  };

  #renderPublicAndTechnicalNrSection = () => {
    return (
      <>
        <Grid item xs={6}>
          <Typography variant="caption">PUBLIKT NR</Typography>
          <TextField
            id="standard-helperText"
            onChange={this.handlePublicLineNameChange}
            value={this.state.publicLineName}
          />
        </Grid>
        <Grid item xs={6}>
          <Typography variant="caption">TEKNISKT NR</Typography>
          <TextField
            id="standard-helperText"
            onChange={this.handleInternalLineNrChange}
            value={this.state.internalLineNumber}
          />
        </Grid>
      </>
    );
  };

  #renderInputValueSection = () => {
    return (
      <Grid item xs={12}>
        <Typography variant="caption">VIA HÅLLPLATS</Typography>
        <TextField
          fullWidth
          id="standard-helperText"
          value={this.state.throughStopArea}
          onChange={this.handleThroughStopAreaChange}
        />
      </Grid>
    );
  };

  #renderTrafficTypeSection = () => {
    const { trafficTransports } = this.state;
    const { classes } = this.props;
    return (
      <Grid item xs={12}>
        <FormControl fullWidth>
          <Typography variant="caption">TRAFIKSLAG</Typography>
          <Select
            value={this.state.trafficTransport}
            onChange={this.handleTrafficTransportChange}
          >
            {trafficTransports.map((name, index) => {
              if (name === "") {
                return (
                  <MenuItem
                    key={index}
                    value={name}
                    className={classes.firstMenuItem}
                  >
                    {name}
                  </MenuItem>
                );
              } else {
                return (
                  <MenuItem key={index} value={name}>
                    <Typography>{name}</Typography>
                  </MenuItem>
                );
              }
            })}
          </Select>
        </FormControl>
      </Grid>
    );
  };
  #renderMunicipalitySection = () => {
    const { classes } = this.props;
    const { municipalities } = this.state;
    return (
      <Grid item xs={12}>
        <FormControl fullWidth>
          <Typography variant="caption">KOMMUN</Typography>
          <Select
            value={this.state.municipality}
            onChange={this.handleMunicipalChange}
          >
            {municipalities.map((municipality, index) => {
              if (municipality.name === "") {
                return (
                  <MenuItem
                    className={classes.firstMenuItem}
                    key={index}
                    value={municipality}
                  >
                    <Typography>{municipality.name}</Typography>
                  </MenuItem>
                );
              } else {
                return (
                  <MenuItem key={index} value={municipality}>
                    <Typography>{municipality.name}</Typography>
                  </MenuItem>
                );
              }
            })}
          </Select>
        </FormControl>
      </Grid>
    );
  };

  #renderSearchButtonSection = () => {
    const { classes } = this.props;
    return (
      <Grid item xs={12}>
        <Button
          className={classes.searchButton}
          onClick={this.doSearch}
          variant="outlined"
        >
          <Typography className={classes.searchButtonText}>SÖK</Typography>
        </Button>
        {this.#renderSearchCheckboxSection()}
      </Grid>
    );
  };

  #renderSearchCheckboxSection = () => {
    const { classes } = this.props;
    return (
      <FormControlLabel
        className={classes.showLinesCheckbox}
        control={
          <Checkbox
            checked={this.state.showStopAreas}
            onChange={this.#handleCheckBoxClick}
            color="default"
          />
        }
        label="Visa hållplatser"
      />
    );
  };

  #renderSpatialSearchSection = () => {
    const { classes } = this.props;
    return (
      <>
        <Grid item xs={12}>
          <Divider className={classes.divider} />
        </Grid>
        <Grid item xs={12}>
          <Typography variant="body2">AVGRÄNSA SÖKOMRÅDE I KARTAN</Typography>
        </Grid>
        <Grid justify="center" container>
          <Grid item xs={4}>
            <div>
              <img
                src={
                  this.state.isPolygonActive ? ActivePolygon : InactivePolygon
                }
                onClick={this.togglePolygonState}
                value={this.state.selectedFormType}
                alt="#"
              ></img>
            </div>
            <Grid item xs={4}>
              <Typography variant="body2">POLYGON</Typography>
            </Grid>
          </Grid>
          <Grid item xs={4}>
            <div>
              <img
                src={
                  this.state.isRectangleActive
                    ? ActiveRectangle
                    : InactiveRectangle
                }
                onClick={this.toggleRectangleState}
                value={this.state.selectedFormType}
                alt="#"
              ></img>
            </div>
            <Grid item xs={4}>
              <Typography variant="body2">REKTANGEL</Typography>
            </Grid>
          </Grid>
        </Grid>
      </>
    );
  };
  render() {
    return (
      <div>
        <Grid
          container
          justify="center"
          spacing={2}
          onKeyPress={this.#handleKeyPress}
        >
          {this.#renderPublicAndTechnicalNrSection()}
          {this.#renderInputValueSection()}
          {this.#renderTrafficTypeSection()}
          {this.#renderMunicipalitySection()}
          {this.#renderSearchButtonSection()}
          {this.#renderSpatialSearchSection()}
        </Grid>
      </div>
    );
  }
}

// Exporting like this adds some props to DummyView.
// withStyles will add a 'classes' prop, while withSnackbar
// adds to functions (enqueueSnackbar() and closeSnackbar())
// that can be used throughout the Component.
export default withStyles(styles)(Lines);
