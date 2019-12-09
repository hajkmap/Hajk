import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import TextField from "@material-ui/core/TextField";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";

// Define JSS styles that will be used in this component.
// Examle below utilizes the very powerful "theme" object
// that gives access to some constants, see: https://material-ui.com/customization/default-theme/
const styles = theme => ({
  publicNr: {
    background: "linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)",
    color: "white",
    margin: 6,
    width: 100,
    borderRadius: 3
  },
  technicalNr: {
    background: "linear-gradient(45deg, #34D86B 30%, #437CE8 90%)",
    color: "white",
    margin: 6,
    width: 100,
    borderRadius: 3
  },
  municipal: {
    width: 200
  },
  traficTransport: {
    padding: "30px 0 0 0",
    width: 200
  }
});

//TODO - Only mockup //Tobias

class Lines extends React.PureComponent {
  // Initialize state - this is the correct way of doing it nowadays.
  state = {
    municipalityNames: [],
    municipalityName: "",
    traficTransportNames: []
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
      this.model.getTransportModeTypeName().then(result => {
        this.setState({
          traficTransportNames: result
        });
      });
    });
  }
  handleMunicipalChange = e => {
    this.setState({
      municipalityName: e.target.value
    });
  };
  handleTraficTransporChange = e => {
    this.setState({
      traficTransportName: e.target.value
    });
  };

  render() {
    const { classes } = this.props;
    const { municipalityNames, traficTransportNames } = this.state;
    return (
      <div>
        <div>Här ska vi lägga till formuläret för linjer</div>
        <TextField
          id="standard-helperText"
          label="Publikt nr"
          className={classes.technicalNr}
        />
        <TextField
          id="standard-helperText"
          label="Tekniskt nr"
          className={classes.publicNr}
        />
        <InputLabel>Kommun</InputLabel>
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

        <InputLabel className={classes.traficTransport}>Trafikslag</InputLabel>
        <Select
          value={this.state.traficTransportName}
          onChange={this.handleTraficTransporChange}
        >
          {traficTransportNames.map((name, index) => {
            return (
              <MenuItem key={index} value={name}>
                {name}
              </MenuItem>
            );
          })}
        </Select>
      </div>
    );
  }
}

// Exporting like this adds some props to DummyView.
// withStyles will add a 'classes' prop, while withSnackbar
// adds to functions (enqueueSnackbar() and closeSnackbar())
// that can be used throughout the Component.
export default withStyles(styles)(Lines);
