import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import { Typography, Divider } from "@material-ui/core";
import Grid from "@material-ui/core/Grid";
import DateFnsUtils from "@date-io/date-fns";
import AccessTimeIcon from "@material-ui/icons/AccessTime";
import PolygonIcon from "../img/polygonmarkering.png";
import RectangleIcon from "../img/rektangelmarkering.png";

import {
  MuiPickersUtilsProvider,
  KeyboardTimePicker,
  KeyboardDatePicker
} from "@material-ui/pickers";

// Define JSS styles that will be used in this component.
// Examle below utilizes the very powerful "theme" object
// that gives access to some constants, see: https://material-ui.com/customization/default-theme/
const styles = theme => ({
  journeysForm: { marginTop: 10 },
  dateFrom: { marginTop: 0, marginBottom: -4 },
  timeFrom: { marginBottom: 40 },
  iconText: { fontSize: 10, width: 50 },
  divider: { margin: theme.spacing(3, 3) },
  textFields: { marginLeft: 10 },
  polygonAndRectangleForm: {
    verticalAlign: "baseline",
    float: "left",
    marginBottom: 10
  }
});

//TODO - Only mockup //Tobias

class Journeys extends React.PureComponent {
  // Initialize state - this is the correct way of doing it nowadays.
  state = {
    fromTime: null,
    activeTool: undefined,
    selectedFromDate: new Date(),
    selectedEndDate: new Date().setHours(new Date().getHours() + 2),
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
  }

  handleFromDateChange = date => {
    this.setState(
      {
        selectedFromDate: date
      },
      console.log(date + " date")
    );
  };
  handleEndDateChange = date => {
    this.setState({
      selectedEndDate: date
    });
  };

  handlePolygonChange = () => {
    const { selectedFromDate, selectedEndDate } = this.state;
    let formatFromDate = new Date(selectedFromDate).toISOString(); // format the date to yyyy-mm-ddThh-mm-ss
    let formatEndDate = new Date(selectedEndDate).toISOString(); // format the date to yyyy-mm-ddThh-mm-ss
    this.localObserver.publish("journeys-search", {
      selectedFromDate: formatFromDate,
      selectedEndDate: formatEndDate,
      selectedFormType: "Polygon"
    });
  };
  handleRectangleChange = () => {
    const { selectedFromDate, selectedEndDate } = this.state;
    this.localObserver.publish("journeys-search", {
      selectedFromDate: selectedFromDate,
      selectedEndDate: selectedEndDate,
      selectedFormType: "Box"
    });
  };
  render() {
    const { classes } = this.props;

    return (
      <div>
        <MuiPickersUtilsProvider
          className={classes.journeysForm}
          utils={DateFnsUtils}
        >
          <Grid container justify="space-around">
            <KeyboardDatePicker
              className={classes.dateFrom}
              format="yyyy-MM-dd"
              margin="normal"
              label="Från och med"
              invalidDateMessage="Fel värde på datum"
              value={this.state.selectedFromDate}
              onChange={this.handleFromDateChange}
              KeyboardButtonProps={{
                "aria-label": "change date"
              }}
              InputLabelProps={{
                shrink: true
              }}
            />
            <KeyboardTimePicker
              className={classes.timeFrom}
              margin="normal"
              id="time-picker"
              ampm={false}
              invalidDateMessage="Fel värde på tid"
              keyboardIcon={<AccessTimeIcon></AccessTimeIcon>}
              value={this.state.selectedFromDate}
              onChange={this.handleFromDateChange}
              KeyboardButtonProps={{
                "aria-label": "change time"
              }}
            />
            <KeyboardDatePicker
              className={classes.dateFrom}
              format="yyyy-MM-dd"
              margin="normal"
              label="Till och med"
              invalidDateMessage="Fel värde på datum"
              value={this.state.selectedEndDate}
              onChange={this.handleEndDateChange}
              KeyboardButtonProps={{
                "aria-label": "change date"
              }}
              InputLabelProps={{
                shrink: true
              }}
            />
            <KeyboardTimePicker
              margin="normal"
              ampm={false}
              invalidDateMessage="Fel värde på tid"
              keyboardIcon={<AccessTimeIcon></AccessTimeIcon>}
              value={this.state.selectedEndDate}
              onChange={this.handleEndDateChange}
              KeyboardButtonProps={{
                "aria-label": "change time"
              }}
            />
          </Grid>
        </MuiPickersUtilsProvider>
        <Divider className={classes.divider} />
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
export default withStyles(styles)(Journeys);
