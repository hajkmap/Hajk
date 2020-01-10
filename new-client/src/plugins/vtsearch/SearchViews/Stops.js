import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import Radio from "@material-ui/core/Radio";
import RadioGroup from "@material-ui/core/RadioGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormControl from "@material-ui/core/FormControl";
import BorderStyleIcon from "@material-ui/icons/BorderStyle";
import SquareIcon from "@material-ui/icons/CropSquare";
import { TextField, Button, Typography } from "@material-ui/core";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";

// Define JSS styles that will be used in this component.
// Examle below utilizes the very powerful "theme" object
// that gives access to some constants, see: https://material-ui.com/customization/default-theme/
const styles = theme => ({
  setStandardWidth: { width: 200 },
  button: { marginTop: 8 }
});

class Stops extends React.PureComponent {
  // Initialize state - this is the correct way of doing it nowadays.
  state = {
    setBusSopAreaValue: "stopAreas",
    stopNameOrNr: "",
    publicLine: "",
    municipalityNames: [],
    municipalityName: "",
    selectedFormType: "",
    doSpetial: false
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
    this.model.getMunicipalityZoneNames().then(result => {
      this.setState({
        municipalityNames: result.length > 0 ? result : []
      });
    });
  }

  handleChange = event => {
    this.setState({
      setBusSopAreaValue: event.target.value
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

  doSpetialChange = () => {
    const {
      stopNameOrNr,
      publicLine,
      municipalityName,
      setBusSopAreaValue,
      selectedFormType
    } = this.state;
    this.localObserver.publish("stops-search", {
      stopNameOrNr: stopNameOrNr,
      publicLine: publicLine,
      municipalityName: municipalityName,
      setBusSopAreaValue: setBusSopAreaValue,
      selectedFormType: ""
    });
  };

  handlePolygonChange = () => {
    const {
      stopNameOrNr,
      publicLine,
      municipalityName,
      setBusSopAreaValue,
      selectedFormType
    } = this.state;
    this.localObserver.publish("stops-search", {
      stopNameOrNr: stopNameOrNr,
      publicLine: publicLine,
      municipalityName: municipalityName,
      setBusSopAreaValue: setBusSopAreaValue,
      selectedFormType: "Polygon"
    });
  };
  handleRectangleChange = () => {
    const {
      stopNameOrNr,
      publicLine,
      municipalityName,
      setBusSopAreaValue,
      selectedFormType
    } = this.state;
    this.localObserver.publish("stops-search", {
      stopNameOrNr: stopNameOrNr,
      publicLine: publicLine,
      municipalityName: municipalityName,
      setBusSopAreaValue: setBusSopAreaValue,
      selectedFormType: "Box"
    });
  };

  render() {
    const { classes } = this.props;
    const { municipalityNames } = this.state;
    return (
      <div>
        <div>
          Här ska vi lägga till formuläret för hållplatser och hållplatsområden
        </div>
        <FormControl component="fieldset">
          <RadioGroup
            aria-label="Stops"
            name="Stop"
            value={this.state.setBusSopAreaValue}
            onChange={this.handleChange}
          >
            <FormControlLabel
              value="stopAreas"
              control={<Radio color="primary" />}
              label="Hållplatsområden"
            />
            <FormControlLabel
              value="stopPoints"
              control={<Radio color="primary" />}
              label="Hållplatslägen"
            />
          </RadioGroup>
        </FormControl>
        <TextField
          id="standard-basic"
          label="Hållplatsnamn eller -nr"
          value={this.state.stopNameOrNr}
          onChange={this.handleStopNameOrNrChange}
          className={classes.setStandardWidth}
        ></TextField>
        <TextField
          id="standard-basic"
          label="Längs publik linje"
          value={this.state.publicLine}
          onChange={this.handlePublicLineChange}
          className={classes.setStandardWidth}
        />
        <FormControl>
          <InputLabel>Kommun</InputLabel>
          <Select
            value={this.state.municipalityName}
            onChange={this.handleMunicipalChange}
            className={classes.setStandardWidth}
          >
            {municipalityNames.map((name, index) => {
              return (
                <MenuItem
                  key={index}
                  value={name}
                  className={classes.setStandardWidth}
                >
                  {name}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
        <Button
          className={classes.button}
          variant="outlined"
          type="button"
          title="Sök"
          value={this.state.doSpetial}
          onClick={this.doSpetialChange}
        >
          Sök
          <BorderStyleIcon />
        </Button>
        <Typography className={classes.button}>
          Markera sökområde i kartan
        </Typography>
        <Button
          className={classes.button}
          variant="outlined"
          type="button"
          value={this.state.selectedFormType}
          onClick={this.handlePolygonChange}
        >
          Polygon
          <BorderStyleIcon />
        </Button>
        <Button
          variant="outlined"
          type="button"
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
export default withStyles(styles)(Stops);
