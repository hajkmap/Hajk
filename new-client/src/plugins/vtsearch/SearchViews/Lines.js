import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import {
  TextField,
  Button,
  Typography,
  Divider,
  Grid,
  FormControl
} from "@material-ui/core";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import PolygonIcon from "../img/polygonmarkering.png";
import RectangleIcon from "../img/rektangelmarkering.png";

// Define JSS styles that will be used in this component.
// Examle below utilizes the very powerful "theme" object
// that gives access to some constants, see: https://material-ui.com/customization/default-theme/
const styles = theme => ({
  searchButton: { marginTop: 8 },
  divider: { margin: theme.spacing(3, 3) },
  textFields: { marginLeft: 10 },
  fontSize: { fontSize: 12 },
  polygonAndRectangle: {
    marginLeft: 10
  },
  firstMenuItem: {
    minHeight: 36
  }
});

//TODO - Only mockup //Tobias

class Lines extends React.PureComponent {
  // Initialize state - this is the correct way of doing it nowadays.
  state = {
    publicLineName: "",
    internalLineNumber: "",
    municipalities: [],
    municipalityName: "",
    trafficTransportNames: [],
    trafficTransportName: "",
    throughStopArea: ""
  };

  // propTypes and defaultProps are static properties, declared
  // as high as possible within the component code. They should
  // be immediately visible to other devs reading the file,
  // since they serve as documentation.
  static propTypes = {
    model: PropTypes.object.isRequired,
    app: PropTypes.object.isRequired,
    localObserver: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired
  };

  static defaultProps = {};

  constructor(props) {
    // If you're not using some of properties defined below, remove them from your code.
    // They are shown here for demonstration purposes only.
    super(props);
    this.model = this.props.model;
    this.localObserver = this.props.localObserver;
    this.globalObserver = this.props.app.globalObserver;
    this.model.fetchAllPossibleMunicipalityZoneNames().then(result => {
      this.setState({
        municipalities: result.length > 0 ? result : []
      });
      this.model.fetchAllPossibleTransportModeTypeName().then(result => {
        this.setState({
          trafficTransportNames: result.length > 0 ? result : []
        });
      });
    });
  }
  doSpatialChange = () => {
    const {
      publicLineName,
      internalLineNumber,
      municipalityName,
      trafficTransportName,
      throughStopArea
    } = this.state;
    this.localObserver.publish("routes-search", {
      publicLineName: publicLineName,
      internalLineNumber: internalLineNumber,
      municipalityName: municipalityName.gid,
      trafficTransportName: trafficTransportName,
      throughStopArea: throughStopArea,
      selectedFormType: ""
    });
  };

  handlePolygonChange = () => {
    const {
      publicLineName,
      internalLineNumber,
      municipalityName,
      trafficTransportName,
      throughStopArea
    } = this.state;
    this.localObserver.publish("routes-search", {
      publicLineName: publicLineName,
      internalLineNumber: internalLineNumber,
      municipalityName: municipalityName.gid,
      trafficTransportName: trafficTransportName,
      throughStopArea: throughStopArea,
      selectedFormType: "Polygon"
    });
  };
  handleRectangleChange = () => {
    const {
      publicLineName,
      internalLineNumber,
      municipalityName,
      trafficTransportName,
      throughStopArea
    } = this.state;
    this.localObserver.publish("routes-search", {
      publicLineName: publicLineName,
      internalLineNumber: internalLineNumber,
      municipalityName: municipalityName.gid,
      trafficTransportName: trafficTransportName,
      throughStopArea: throughStopArea,
      selectedFormType: "Box"
    });
  };

  handleInternalLineNrChange = event => {
    this.setState({
      internalLineNumber: event.target.value
    });
  };
  handlePublicLineNameChange = event => {
    this.setState({
      publicLineName: event.target.value
    });
  };
  handleMunicipalChange = e => {
    this.setState({
      municipalityName: e.target.value
    });
  };
  handleTrafficTransportChange = e => {
    this.setState({
      trafficTransportName: e.target.value
    });
  };
  handleThroughStopAreaChange = event => {
    this.setState({
      throughStopArea: event.target.value
    });
  };

  renderPublicAndTechnicalNrSection = () => {
    return (
      <>
        <Grid item xs={6}>
          <Typography variant="caption">Publikt nr</Typography>
          <TextField
            id="standard-helperText"
            onChange={this.handlePublicLineNameChange}
            value={this.state.publicLineName}
          />
        </Grid>
        <Grid item xs={6}>
          <Typography variant="caption">Tekniskt nr</Typography>
          <TextField
            id="standard-helperText"
            onChange={this.handleInternalLineNrChange}
            value={this.state.internalLineNumber}
          />
        </Grid>
      </>
    );
  };

  renderInputValueSection = () => {
    return (
      <Grid item xs={12}>
        <Typography variant="caption">Via Hållplats</Typography>
        <TextField
          fullWidth
          id="standard-helperText"
          value={this.state.throughStopArea}
          onChange={this.handleThroughStopAreaChange}
        />
      </Grid>
    );
  };

  renderTrafficTypeSection = () => {
    const { trafficTransportNames } = this.state;
    return (
      <Grid item xs={12}>
        <FormControl fullWidth>
          <Typography variant="caption">Trafikslag</Typography>
          <Select
            value={this.state.trafficTransportName}
            onChange={this.handleTrafficTransportChange}
          >
            {trafficTransportNames.map((name, index) => {
              return (
                <MenuItem key={index} value={name}>
                  {name}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      </Grid>
    );
  };
  renderMunicipalitySection = () => {
    const { classes } = this.props;
    const { municipalities } = this.state;
    return (
      <Grid item xs={12}>
        <FormControl fullWidth>
          <Typography variant="caption">Kommun</Typography>
          <Select
            value={this.state.municipalityName}
            onChange={this.handleMunicipalChange}
          >
            {municipalities.map((municipality, index) => {
              if (municipality.name === "") {
                return (
                  <MenuItem
                    className={classes.firstMenuItem}
                    key={index}
                    value={municipality.name}
                  >
                    <Typography>{municipality.name}</Typography>
                  </MenuItem>
                );
              } else {
                return (
                  <MenuItem key={index} value={municipality.name}>
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

  renderSearchButtonSection = () => {
    const { classes } = this.props;
    return (
      <Grid item xs={12}>
        <Button
          className={classes.searchButton}
          onClick={this.doSpatialChange}
          variant="outlined"
        >
          Sök
        </Button>
      </Grid>
    );
  };

  renderSpatialSearchSection = () => {
    const { classes } = this.props;
    return (
      <>
        <Grid item xs={12}>
          <Divider className={classes.divider} />
        </Grid>
        <Grid item xs={12}>
          <Typography variant="body2">Avgränsa sökområde i kartan</Typography>
        </Grid>
        <Grid justify="center" container>
          <Grid item xs={3}>
            <a href="/#">
              <img
                src={PolygonIcon}
                value={this.state.selectedFormType}
                onClick={this.handlePolygonChange}
                alt="#"
              ></img>
            </a>
            <Grid item xs={3}>
              <Typography variant="body2">Polygon</Typography>
            </Grid>
          </Grid>
          <Grid item xs={3}>
            <a href="/#">
              <img
                src={RectangleIcon}
                value={this.state.selectedFormType}
                onClick={this.handleRectangleChange}
                alt="#"
              ></img>
            </a>
            <Grid item xs={3}>
              <Typography variant="body2">Rektangel</Typography>
            </Grid>
          </Grid>
        </Grid>
      </>
    );
  };
  render() {
    return (
      <div>
        <Grid container justify="center" spacing={2}>
          {this.renderPublicAndTechnicalNrSection()}
          {this.renderInputValueSection()}
          {this.renderTrafficTypeSection()}
          {this.renderMunicipalitySection()}
          {this.renderSearchButtonSection()}
          {this.renderSpatialSearchSection()}
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
