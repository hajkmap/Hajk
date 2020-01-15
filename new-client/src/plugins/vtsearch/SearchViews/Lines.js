import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import { TextField, Button, Typography, Divider } from "@material-ui/core";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import PolygonIcon from "../img/polygonmarkering.png";
import RectangleIcon from "../img/rektangelmarkering.png";

// Define JSS styles that will be used in this component.
// Examle below utilizes the very powerful "theme" object
// that gives access to some constants, see: https://material-ui.com/customization/default-theme/
const styles = theme => ({
  publicNr: {
    color: "white",
    width: 94,
    margin: 3
  },
  technicalNr: {
    color: "white",
    width: 94,
    margin: 3
  },
  standardWidth: {
    width: 200
  },
  addSpaceAroundField: {
    padding: "20px 0 0 0",
    width: 200
  },
  trafficTransport: {
    width: 200
  },
  textFieldBox: {
    marginBottom: 10
  },
  divider: {
    margin: theme.spacing(3)
  },
  textFields: {
    marginLeft: 10
  },
  fontSize: { fontSize: 12 },

  polygonAndRectangleForm: {
    verticalAlign: "baseline",
    float: "left",
    marginBottom: 15
  }
});

//TODO - Only mockup //Tobias

class Lines extends React.PureComponent {
  // Initialize state - this is the correct way of doing it nowadays.
  state = {
    publicLineName: "",
    internalLineNumber: "",
    municipalityNames: [],
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
    this.model.autocompleteMunicipalityZoneNames().then(result => {
      this.setState({
        municipalityNames: result.length > 0 ? result : []
      });
      this.model.autocompleteTransportModeTypeName().then(result => {
        this.setState({
          trafficTransportName: result.length > 0 ? result : []
        });
      });
    });
  }
  doSpetialChange = () => {
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
      municipalityName: municipalityName,
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
      municipalityName: municipalityName,
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
      municipalityName: municipalityName,
      trafficTransportName: trafficTransportName,
      throughStopArea: throughStopArea,
      selectedFormType: "Box"
    });
  };

  // testDebug = e => {
  //   console.log("testdebug");
  //   this.model.getRoutes("300");
  // };
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

  render() {
    const { classes } = this.props;
    const { municipalityNames, trafficTransportNames } = this.state;
    return (
      <div>
        <div className={classes.textFieldBox}>
          <TextField
            id="standard-helperText"
            label="Publikt nr"
            className={classes.technicalNr}
            onChange={this.handlePublicLineNameChange}
            value={this.state.publicLineName}
            InputLabelProps={{
              shrink: true
            }}
          />
          <TextField
            id="standard-helperText"
            label="Tekniskt nr"
            className={classes.publicNr}
            onChange={this.handleInternalLineNrChange}
            value={this.state.internalLineNumber}
            InputLabelProps={{
              shrink: true
            }}
          />
        </div>
        <div className={classes.textFieldBox}>
          <TextField
            className={classes.standardWidth}
            id="standard-helperText"
            label="Via hållplatsområde"
            value={this.state.throughStopArea}
            onChange={this.handleThroughStopAreaChange}
            InputLabelProps={{
              shrink: true
            }}
          />
        </div>
        <div className={classes.textFieldBox}>
          <InputLabel className={classes.fontSize}>Trafikslag</InputLabel>
          <Select
            className={classes.trafficTransport}
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
        </div>
        <div className={classes.textFieldBox}>
          <InputLabel className={classes.fontSize}>Kommun</InputLabel>
          <Select
            value={this.state.municipalityName}
            onChange={this.handleMunicipalChange}
          >
            {municipalityNames.map((name, index) => {
              return (
                <MenuItem key={index} value={name}>
                  {name}
                </MenuItem>
              );
            })}
          </Select>
        </div>
        <Button onClick={this.doSpetialChange} variant="outlined">
          Sök
        </Button>

        <Divider variant="inset" className={classes.divider} />
        <Typography>Markera sökområde i kartan</Typography>
        <div className={classes.polygonAndRectangleForm}>
          <a href="/#">
            <img
              src={PolygonIcon}
              value={this.state.selectedFormType}
              onClick={this.handlePolygonChange}
              alt="#"
            ></img>
          </a>
          <br />
          <Typography className={classes.textFields} variant="body2">
            Polygon
          </Typography>
        </div>
        <div className={classes.polygonAndRectangleForm}>
          <a href="/#">
            <img
              src={RectangleIcon}
              value={this.state.selectedFormType}
              onClick={this.handleRectangleChange}
              alt="#"
            ></img>
          </a>
          <br />
          <Typography className={classes.textFields} variant="body2">
            Rektangel
          </Typography>
        </div>
      </div>
    );
  }
}

// Exporting like this adds some props to DummyView.
// withStyles will add a 'classes' prop, while withSnackbar
// adds to functions (enqueueSnackbar() and closeSnackbar())
// that can be used throughout the Component.
export default withStyles(styles)(Lines);
