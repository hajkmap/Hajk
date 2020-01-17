import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import Radio from "@material-ui/core/Radio";
import RadioGroup from "@material-ui/core/RadioGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormControl from "@material-ui/core/FormControl";
import { TextField, Button, Typography, Divider } from "@material-ui/core";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";
import PolygonIcon from "../img/polygonmarkering.png";
import RectangleIcon from "../img/rektangelmarkering.png";

// Define JSS styles that will be used in this component.
// Examle below utilizes the very powerful "theme" object
// that gives access to some constants, see: https://material-ui.com/customization/default-theme/
const styles = theme => ({
  setStandardWidth: { width: 200 },
  searchButton: { marginTop: 8, width: 200 },
  fontSize: { fontSize: 12 },
  textFieldBox: { marginBottom: 10 },
  divider: { margin: theme.spacing(3) },
  textFields: { marginLeft: 10 },
  checkBox: { marginTop: -10 },
  sizeSmall: { fontSize: 14, marginTop: -8 },
  radioButtonText: { fontSize: 14 },
  polygonAndRectangleForm: {
    verticalAlign: "baseline",
    float: "left",
    marginBottom: 15
  },
  overrides: {
    MuiTypographyBody1: {
      root: {
        color: "red",
        fontSize: 13
      }
    }
  }
});

class Stops extends React.PureComponent {
  // Initialize state - this is the correct way of doing it nowadays.
  state = {
    busStopValue: "stopAreas",
    stopNameOrNr: "",
    publicLine: "",
    municipalityNames: [],
    municipalityName: "",
    selectedFormType: ""
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
    });
  }

  handleChange = event => {
    this.setState({
      busStopValue: event.target.value
    });
  };

  handleStopNameOrNrChange = event => {
    this.setState({
      stopNameOrNr: event.target.value
    });
  };

  handlePublicLineChange = event => {
    this.setState({
      publicLine: event.target.value
    });
  };

  handleMunicipalChange = e => {
    this.setState({
      municipalityName: e.target.value
    });
  };

  doSpatialChange = () => {
    const {
      busStopValue,
      stopNameOrNr,
      publicLine,
      municipalityName
    } = this.state;
    this.localObserver.publish("stops-search", {
      busStopValue: busStopValue,
      stopNameOrNr: stopNameOrNr,
      publicLine: publicLine,
      municipalityName: municipalityName,
      selectedFormType: ""
    });
  };

  handlePolygonChange = () => {
    const {
      busStopValue,
      stopNameOrNr,
      publicLine,
      municipalityName
    } = this.state;
    this.localObserver.publish("stops-search", {
      busStopValue: busStopValue,
      stopNameOrNr: stopNameOrNr,
      publicLine: publicLine,
      municipalityName: municipalityName,
      selectedFormType: "Polygon"
    });
  };
  handleRectangleChange = () => {
    const {
      busStopValue,
      stopNameOrNr,
      publicLine,
      municipalityName
    } = this.state;
    this.localObserver.publish("stops-search", {
      busStopValue: busStopValue,
      stopNameOrNr: stopNameOrNr,
      publicLine: publicLine,
      municipalityName: municipalityName,
      selectedFormType: "Box"
    });
  };

  render() {
    const { classes } = this.props;
    const { municipalityNames } = this.state;
    return (
      <div>
        <FormControl component="fieldset">
          <RadioGroup
            aria-label="Stops"
            name="Stop"
            value={this.state.busStopValue}
            onChange={this.handleChange}
          >
            <FormControlLabel
              value="stopAreas"
              control={<Radio color="primary" />}
              label="Hållplatsområden"
              classes={{ label: classes.radioButtonText }}
            />
            <FormControlLabel
              value="stopPoints"
              control={<Radio color="primary" className={classes.checkBox} />}
              label="Hållplatslägen"
              classes={{ label: classes.sizeSmall }}
            />
          </RadioGroup>
        </FormControl>
        <Divider className={classes.divider} />
        <div className={classes.textFieldBox}>
          <TextField
            id="standard-basic"
            label="Hållplatsnamn eller -nr"
            value={this.state.stopNameOrNr}
            onChange={this.handleStopNameOrNrChange}
            className={classes.setStandardWidth}
            InputLabelProps={{
              shrink: true
            }}
          ></TextField>
        </div>
        <div className={classes.textFieldBox}>
          <TextField
            id="standard-basic"
            label="Längs publik linje"
            value={this.state.publicLine}
            onChange={this.handlePublicLineChange}
            className={classes.setStandardWidth}
            InputLabelProps={{
              shrink: true
            }}
          />
        </div>
        <div className={classes.textFieldBox}>
          <InputLabel className={classes.fontSize}>Kommun</InputLabel>
          <Select
            value={this.state.municipalityName}
            onChange={this.handleMunicipalChange}
            className={classes.setStandardWidth}
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
        <Button
          className={classes.searchButton}
          variant="outlined"
          type="button"
          title="Sök"
          onClick={this.doSpatialChange}
        >
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
export default withStyles(styles)(Stops);
