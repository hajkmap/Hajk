import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import { Typography, Divider } from "@material-ui/core";
import Grid from "@material-ui/core/Grid";
import DateFnsUtils from "@date-io/date-fns";
import AccessTimeIcon from "@material-ui/icons/AccessTime";
import EventIcon from "@material-ui/icons/Event";
import InactivePolygon from "../img/polygonmarkering.png";
import InactiveRectangle from "../img/rektangelmarkering.png";
import ActivePolygon from "../img/polygonmarkering-blue.png";
import ActiveRectangle from "../img/rektangelmarkering-blue.png";

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
  dateForm: {
    marginTop: 0,
    marginBottom: -4,
    color: theme.palette.primary.main
  },
  spaceToFromDate: { marginBottom: 40 },
  divider: { marginTop: theme.spacing(3), marginBottom: theme.spacing(3) },
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
    selectedFromTime: new Date().setHours(new Date().getHours()),
    selectedEndDate: new Date(),
    selectedEndDTime: new Date().setHours(new Date().getHours() + 1),
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
  handleFromTimeChange = time => {
    this.setState({
      selectedFromTime: time
    });
  };
  handleFromDateChange = date => {
    this.setState({
      selectedFromDate: date
    });
  };
  handleEndTimeChange = time => {
    this.setState({
      selectedEndDTime: time
    });
  };
  handleEndDateChange = date => {
    this.setState({
      selectedEndDate: date
    });
  };

  getFormattedDate = () => {
    const {
      selectedFromDate,
      selectedEndDate,
      selectedEndDTime,
      selectedFromTime
    } = this.state;
    let fromTime = new Date(selectedFromTime);
    let endTime = new Date(selectedEndDTime);

    let formatFromDate = new Date(
      selectedFromDate.getFullYear(),
      selectedFromDate.getMonth(),
      selectedFromDate.getDate(),
      fromTime.getHours(),
      fromTime.getMinutes() - fromTime.getTimezoneOffset(),
      fromTime.getSeconds()
    ).toISOString();

    let formatEndDate = new Date(
      selectedEndDate.getFullYear(),
      selectedEndDate.getMonth(),
      selectedEndDate.getDate(),
      endTime.getHours(),
      endTime.getMinutes() - endTime.getTimezoneOffset(),
      endTime.getSeconds()
    ).toISOString();

    var result = {
      formatFromDate: formatFromDate,
      formatEndDate: formatEndDate
    };

    return result;
  };

  /**
   * Method that in actives both spatial buttons.
   *
   * @memberof Journeys
   */
  inactivateSpatialSearchButtons = () => {
    this.setState({ isPolygonActive: false, isRectangleActive: false });
  };

  handlePolygonClick = () => {
    const { formatFromDate, formatEndDate } = this.getFormattedDate();
    this.localObserver.publish("journeys-search", {
      selectedFromDate: formatFromDate,
      selectedEndDate: formatEndDate,
      selectedFormType: "Polygon",
      searchCallback: this.inactivateSpatialSearchButtons
    });
  };
  handleRectangleClick = () => {
    const { formatFromDate, formatEndDate } = this.getFormattedDate();
    this.localObserver.publish("journeys-search", {
      selectedFromDate: formatFromDate,
      selectedEndDate: formatEndDate,
      selectedFormType: "Box",
      searchCallback: this.inactivateSpatialSearchButtons
    });
  };

  renderFromDateSection = () => {
    const { classes } = this.props;
    return (
      <>
        <Grid item xs={12}>
          <Typography variant="caption">FRÅN OCH MED</Typography>
          <KeyboardTimePicker
            margin="normal"
            id="time-picker"
            ampm={false}
            className={classes.dateForm}
            invalidDateMessage="FEL VÄRDE PÅ TID"
            keyboardIcon={<AccessTimeIcon></AccessTimeIcon>}
            value={this.state.selectedFromTime}
            onChange={this.handleFromTimeChange}
            KeyboardButtonProps={{
              "aria-label": "change time"
            }}
          />
        </Grid>
        <KeyboardDatePicker
          className={classes.spaceToFromDate}
          format="yyyy-MM-dd"
          margin="normal"
          keyboardIcon={<EventIcon></EventIcon>}
          invalidDateMessage="FEL VÄRDE PÅ DATUM"
          value={this.state.selectedFromDate}
          onChange={this.handleFromDateChange}
          KeyboardButtonProps={{
            "aria-label": "change date"
          }}
        />
      </>
    );
  };

  renderEndDateSection = () => {
    const { classes } = this.props;
    return (
      <Grid container justify="center" spacing={2}>
        <Grid item xs={12}>
          <Typography variant="caption">TILL OCH MED</Typography>
          <KeyboardTimePicker
            margin="normal"
            ampm={false}
            className={classes.dateForm}
            invalidDateMessage="FEL VÄRDE PÅ TID"
            keyboardIcon={<AccessTimeIcon></AccessTimeIcon>}
            value={this.state.selectedEndDTime}
            onChange={this.handleEndTimeChange}
            KeyboardButtonProps={{
              "aria-label": "change time"
            }}
          />
        </Grid>
        <KeyboardDatePicker
          format="yyyy-MM-dd"
          margin="normal"
          invalidDateMessage="FEL VÄRDE PÅ DATUM"
          value={this.state.selectedEndDate}
          className={classes.spaceToFromDate}
          onChange={this.handleEndDateChange}
          KeyboardButtonProps={{
            "aria-label": "change date"
          }}
        />
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
    const { classes } = this.props;

    return (
      <div>
        <MuiPickersUtilsProvider
          className={classes.journeysForm}
          utils={DateFnsUtils}
        >
          {this.renderFromDateSection()}
          {this.renderEndDateSection()}
        </MuiPickersUtilsProvider>
        {this.renderSpatialSearchSection()}
      </div>
    );
  }
}

// Exporting like this adds some props to DummyView.
// withStyles will add a 'classes' prop, while withSnackbar
// adds to functions (enqueueSnackbar() and closeSnackbar())
// that can be used throughout the Component.
export default withStyles(styles)(Journeys);
