import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import Radio from "@material-ui/core/Radio";
import RadioGroup from "@material-ui/core/RadioGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormControl from "@material-ui/core/FormControl";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";
import {
  TextField,
  Button,
  Typography,
  Divider,
  Grid,
  ButtonGroup,
} from "@material-ui/core";
import InactivePolygon from "../img/polygonmarkering.png";
import InactiveRectangle from "../img/rektangelmarkering.png";
import ActivePolygon from "../img/polygonmarkering-blue.png";
import ActiveRectangle from "../img/rektangelmarkering-blue.png";

// Define JSS styles that will be used in this component.
// Examle below utilizes the very powerful "theme" object
// that gives access to some constants, see: https://material-ui.com/customization/default-theme/
const styles = (theme) => ({
  divider: { marginTop: theme.spacing(2), marginBottom: theme.spacing(2) },
  firstMenuItem: { minHeight: 36 },
  searchButtonColor: { borderColor: theme.palette.primary.main },
  searchButtonText: { color: theme.palette.primary.main },
});

class Stops extends React.PureComponent {
  // Initialize state - this is the correct way of doing it nowadays.
  state = {
    busStopValue: "stopAreas",
    stopNameOrNr: "",
    publicLine: "",
    municipalities: [],
    municipality: "",
    selectedFormType: "",
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

  handleChange = (event) => {
    this.setState({
      busStopValue: event.target.value,
    });
  };

  handleStopNameOrNrChange = (event) => {
    this.setState({
      stopNameOrNr: event.target.value,
    });
  };

  handlePublicLineChange = (event) => {
    this.setState({
      publicLine: event.target.value,
    });
  };

  handleMunicipalChange = (event) => {
    this.setState({
      municipality: event.target.value,
    });
  };

  handleKeyPress = (event) => {
    if (event.key === "Enter") {
      this.doSearch();
    }
  };

  bindSubscriptions() {
    const { localObserver } = this.props;
    localObserver.subscribe("vtsearch-result-done", () => {
      this.clearSearchInputAndButtons();
    });
  }

  /**
   * Method that in actives all search inputs and both spatial buttons.
   *
   * @memberof Stops
   */
  clearSearchInputAndButtons = () => {
    this.setState({
      stopNameOrNr: "",
      publicLine: "",
      municipality: "",
      selectedFormType: "",
    });
  };
  inactivateSpatialSearchButtons = () => {
    this.setState({ isPolygonActive: false, isRectangleActive: false });
  };

  doSearch = () => {
    const { busStopValue, stopNameOrNr, publicLine, municipality } = this.state;
    this.localObserver.publish("stops-search", {
      busStopValue: busStopValue,
      stopNameOrNr: stopNameOrNr,
      publicLine: publicLine,
      municipality: municipality.gid,
      selectedFormType: "",
      searchCallback: this.clearSearchInputAndButtons,
    });
  };

  handlePolygonClick = () => {
    const { busStopValue, stopNameOrNr, publicLine, municipality } = this.state;
    if (!this.state.isPolygonActive) {
      this.localObserver.publish("activate-search", () => {});
    }
    if (this.state.isPolygonActive || this.state.isRectangleActive) {
      this.localObserver.publish("deactivate-search", () => {});
      this.setState({ isRectangleActive: false });
    }
    if (this.state.isPolygonActive) {
      this.localObserver.publish("stops-search", {
        busStopValue: busStopValue,
        stopNameOrNr: stopNameOrNr,
        publicLine: publicLine,
        municipality: municipality.name,
        selectedFormType: "Polygon",
        searchCallback: this.inactivateSpatialSearchButtons,
      });
    }
  };
  handleRectangleClick = () => {
    if (!this.state.isRectangleActive) {
      this.localObserver.publish("activate-search", () => {});
    }
    if (this.state.isPolygonActive || this.state.isRectangleActive) {
      this.localObserver.publish("deactivate-search", () => {});
      this.setState({ isPolygonActive: false });
    }
    if (this.state.isRectangleActive) {
      const { busStopValue, stopNameOrNr, publicLine, municipality } =
        this.state;
      this.localObserver.publish("stops-search", {
        busStopValue: busStopValue,
        stopNameOrNr: stopNameOrNr,
        publicLine: publicLine,
        municipality: municipality.name,
        selectedFormType: "Box",
        searchCallback: this.inactivateSpatialSearchButtons,
      });
    }
  };

  renderRadioButtonSection = () => {
    return (
      <Grid item xs={12}>
        <RadioGroup
          aria-label="Stops"
          name="Stop"
          value={this.state.busStopValue}
          onChange={this.handleChange}
        >
          <Grid justify="flex-start" alignItems="center" container>
            <Grid item xs={2}>
              <FormControlLabel
                value="stopAreas"
                control={<Radio color="primary" />}
              />
            </Grid>
            <Grid item xs={10}>
              <Typography variant="body2">HÅLLPLATSOMRÅDE</Typography>
            </Grid>
            <Grid item xs={2}>
              <FormControlLabel
                value="stopPoints"
                control={<Radio color="primary" />}
              />
            </Grid>

            <Grid item xs={10}>
              <Typography variant="body2">HÅLLPLATSLÄGEN</Typography>
            </Grid>
          </Grid>
        </RadioGroup>
      </Grid>
    );
  };

  renderTextParameterSection = () => {
    const { municipalities } = this.state;
    const { classes } = this.props;
    return (
      <>
        <Grid item xs={12}>
          <Divider />
        </Grid>
        <Grid item xs={12}>
          <Typography variant="caption">HÅLLPLATSNAMN ELLER -NR</Typography>
          <TextField
            fullWidth
            id="standard-basic"
            value={this.state.stopNameOrNr}
            onChange={this.handleStopNameOrNrChange}
          ></TextField>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="caption">LÄNGS PUBLIK LINJE</Typography>
          <TextField
            fullWidth
            id="standard-basic"
            value={this.state.publicLine}
            onChange={this.handlePublicLineChange}
          />
        </Grid>
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
      </>
    );
  };

  renderSearchButton = () => {
    const { classes } = this.props;
    return (
      <Grid item xs={12}>
        <ButtonGroup className={classes.searchButtonColor}>
          <Button
            className={classes.searchButtonColor}
            onClick={this.doSearch}
            variant="outlined"
          >
            <Typography className={classes.searchButtonText}>SÖK</Typography>
          </Button>
        </ButtonGroup>
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
          onKeyPress={this.handleKeyPress}
        >
          {this.renderRadioButtonSection()}
          {this.renderTextParameterSection()}
          {this.renderSearchButton()}
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
export default withStyles(styles)(Stops);
