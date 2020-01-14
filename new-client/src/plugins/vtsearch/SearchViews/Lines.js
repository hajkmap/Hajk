import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import { TextField, Button, Typography } from "@material-ui/core";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import BorderStyleIcon from "@material-ui/icons/BorderStyle";
import SquareIcon from "@material-ui/icons/CropSquare";

// Define JSS styles that will be used in this component.
// Examle below utilizes the very powerful "theme" object
// that gives access to some constants, see: https://material-ui.com/customization/default-theme/
const styles = theme => ({
  publicNr: {
    color: "white",
    margin: 3,
    width: 100
  },
  technicalNr: {
    color: "white",
    width: 100,
    margin: 3
  },
  municipal: {
    width: 200
  },
  addSpaceAroundField: {
    padding: "20px 0 0 0",
    width: 200
  },
  trafficTransport: {
    width: 200
  },
  addSpaceAroundButton: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1)
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
        <div>Här ska vi lägga till formuläret för linjer</div>
        <TextField
          id="standard-helperText"
          label="Publikt nr"
          className={classes.technicalNr}
          onChange={this.handlePublicLineNameChange}
          value={this.state.publicLineName}
        />
        <TextField
          id="standard-helperText"
          label="Tekniskt nr"
          className={classes.publicNr}
          onChange={this.handleInternalLineNrChange}
          value={this.state.internalLineNumber}
        />
        <InputLabel className={classes.addSpaceAroundField}>Kommun</InputLabel>
        <Select
          value={this.state.municipalityName}
          onChange={this.handleMunicipalChange}
          className={classes.municipal}
        >
          {municipalityNames.map((name, index) => {
            return (
              <MenuItem key={index} value={name}>
                {name}
              </MenuItem>
            );
          })}
        </Select>

        <InputLabel className={classes.addSpaceAroundField}>
          Trafikslag
        </InputLabel>
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
        <TextField
          className={classes.addSpaceAroundField}
          id="standard-helperText"
          label="Via hållplatsområde"
          value={this.state.throughStopArea}
          onChange={this.handleThroughStopAreaChange}
        />
        <Button
          className={classes.addSpaceAroundButton}
          onClick={this.doSpetialChange}
          variant="outlined"
        >
          Sök
        </Button>

        <Typography className={classes.addSpaceAroundButton}>
          Markera sökområde i kartan
        </Typography>
        <Button
          variant="outlined"
          type="button"
          title="Lägg till polygon"
          value={this.state.selectedFormType}
          onClick={this.handlePolygonChange}
        >
          Polygon
          <BorderStyleIcon />
        </Button>
        <Button
          variant="outlined"
          type="button"
          title="Lägg till rektangel"
          value={this.state.selectedFormType}
          onClick={this.handleRectangleChange}
        >
          Rektangel
          <SquareIcon />
        </Button>
      </div>
    );
  }
}

// Exporting like this adds some props to DummyView.
// withStyles will add a 'classes' prop, while withSnackbar
// adds to functions (enqueueSnackbar() and closeSnackbar())
// that can be used throughout the Component.
export default withStyles(styles)(Lines);
