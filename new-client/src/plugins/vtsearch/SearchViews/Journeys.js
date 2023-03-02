import React from "react";
import PropTypes from "prop-types";
import withStyles from "@mui/styles/withStyles";
import { Typography, Divider } from "@mui/material";
import Grid from "@mui/material/Grid";
import DateFnsUtils from "@date-io/date-fns";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import EventIcon from "@mui/icons-material/Event";
import InactivePolygon from "../img/polygonmarkering.png";
import InactiveRectangle from "../img/rektangelmarkering.png";
import ActivePolygon from "../img/polygonmarkering-blue.png";
import ActiveRectangle from "../img/rektangelmarkering-blue.png";

import {
  MuiPickersUtilsProvider,
  KeyboardTimePicker,
  KeyboardDatePicker,
} from "@material-ui/pickers";

// Define JSS styles that will be used in this component.
// Examle below utilizes the very powerful "theme" object
// that gives access to some constants, see: https://material-ui.com/customization/default-theme/
const styles = (theme) => ({
  journeysForm: { marginTop: 10 },
  dateForm: {
    marginTop: 0,
    marginBottom: -4,
    width: "100%",
    color: theme.palette.primary.main,
  },
  spaceToFromDate: { marginBottom: 40, width: "100%" },
  divider: { marginTop: theme.spacing(3), marginBottom: theme.spacing(3) },
  errorMessage: { color: theme.palette.error.main },
});

class Journeys extends React.PureComponent {
  // Initialize state - this is the correct way of doing it nowadays.
  state = {
    spatialToolsEnabled: true,
    isPolygonActive: false,
    isRectangleActive: false,
    selectedFromDate: new Date(new Date().setHours(0, 0, 0, 0)),
    selectedFromTime: new Date(
      new Date().setHours(new Date().getHours(), new Date().getMinutes(), 0, 0)
    ),
    selectedEndDate: new Date(new Date().setHours(0, 0, 0, 0)),
    selectedEndTime: new Date(
      new Date().setHours(
        new Date().getHours() + 1,
        new Date().getMinutes(),
        0,
        0
      )
    ),
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
  }

  handleFromTimeChange = (fromTime) => {
    this.updateStateForTimeOrDateChange(fromTime);

    // Bug in KeyboardTimePicker, sends today instead of correct date. Merge date and time to fix it.
    const newFromTime = this.mergeDateIntoTime(
      this.state.selectedFromDate,
      fromTime
    );
    if (this.isTimeOrDateValid(newFromTime)) fromTime = newFromTime;

    this.setState(
      {
        selectedFromTime: fromTime,
      },
      () => {
        this.validateDateAndTime(
          this.disablePolygonAndRectangleSearch,
          this.disablePolygonAndRectangleSearch,
          this.disablePolygonAndRectangleSearch,
          this.enablePolygonAndRectangleSearch
        );
        this.reactiveSelectSpatialTool();
      }
    );
    this.addOneHourTime(fromTime);
  };

  handleFromDateChange = (fromDate) => {
    this.updateStateForTimeOrDateChange(fromDate);
    const newFromTime = this.mergeDateIntoTime(
      fromDate,
      this.state.selectedFromTime
    );
    const newEndTime = this.mergeDateIntoTime(
      fromDate,
      this.state.selectedEndTime
    );
    let fromTime = this.state.selectedFromTime;
    let endTime = this.state.selectedEndTime;
    if (
      this.isTimeOrDateValid(newFromTime) &&
      this.isTimeOrDateValid(newEndTime)
    ) {
      fromTime = newFromTime;
      endTime = newEndTime;
    }

    let endDate = this.state.selectedEndDate;
    if (this.isTimeOrDateValid(fromDate)) endDate = fromDate;

    this.setState(
      {
        selectedFromDate: fromDate,
        selectedFromTime: fromTime,
        selectedEndDate: endDate,
        selectedEndTime: endTime,
      },
      () => {
        this.validateDateAndTime(
          this.disablePolygonAndRectangleSearch,
          this.disablePolygonAndRectangleSearch,
          this.disablePolygonAndRectangleSearch,
          this.enablePolygonAndRectangleSearch
        );
        this.reactiveSelectSpatialTool();
      }
    );
  };

  handleEndTimeChange = (endTime) => {
    this.updateStateForTimeOrDateChange(endTime);

    // Bug in KeyboardTimePicker, sends today instead of correct date. Merge date and time to fix it.
    const newEndTime = this.mergeDateIntoTime(
      this.state.selectedEndDate,
      endTime
    );
    if (this.isTimeOrDateValid(newEndTime)) endTime = newEndTime;

    this.setState(
      {
        selectedEndTime: endTime,
      },
      () => {
        this.validateDateAndTime(
          this.disablePolygonAndRectangleSearch,
          this.disablePolygonAndRectangleSearch,
          this.disablePolygonAndRectangleSearch,
          this.enablePolygonAndRectangleSearch
        );
        this.reactiveSelectSpatialTool();
      }
    );
  };

  handleEndDateChange = (endDate) => {
    this.updateStateForTimeOrDateChange(endDate);
    const newEndTime = this.mergeDateIntoTime(
      endDate,
      this.state.selectedEndTime
    );
    let endTime = this.state.selectedEndTime;
    if (this.isTimeOrDateValid(newEndTime)) endTime = newEndTime;

    this.setState(
      {
        selectedEndDate: endDate,
        selectedEndTime: endTime,
      },
      () => {
        this.validateDateAndTime(
          this.disablePolygonAndRectangleSearch,
          this.disablePolygonAndRectangleSearch,
          this.disablePolygonAndRectangleSearch,
          this.enablePolygonAndRectangleSearch
        );
        this.reactiveSelectSpatialTool();
      }
    );
  };

  reactiveSelectSpatialTool = () => {
    if (this.state.spatialToolsEnabled && this.state.isPolygonActive)
      this.activateSearch("Polygon");
    if (this.state.spatialToolsEnabled && this.state.isRectangleActive)
      this.activateSearch("Box");
  };

  updateStateForTimeOrDateChange(timeOrDate) {
    if (!this.isTimeOrDateValid(timeOrDate)) {
      this.disablePolygonAndRectangleSearch();
      return;
    }
    if (!this.state.spatialToolsEnabled) this.enablePolygonAndRectangleSearch();
  }

  isTimeOrDateValid = (timeOrDate) => {
    if (!timeOrDate) return false;
    return timeOrDate.toString() !== "Invalid Date";
  };

  mergeDateIntoTime = (date, time) => {
    if (!this.isTimeOrDateValid(date)) return date;
    if (!this.isTimeOrDateValid(time)) return time;

    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      time.getHours(),
      time.getMinutes(),
      0,
      0
    );
  };

  disablePolygonAndRectangleSearch = () => {
    this.setState({ spatialToolsEnabled: false }, this.deactivateSearch);
  };

  enablePolygonAndRectangleSearch = () => {
    this.setState({ spatialToolsEnabled: true });
  };

  validateDateAndTime = (
    callbackInvalidDate,
    callbackInvalidTime,
    callbackWrongDateAndTime,
    callbackAllIsOK
  ) => {
    const {
      selectedFromDate,
      selectedEndDate,
      selectedEndTime,
      selectedFromTime,
    } = this.state;

    if (
      !this.isTimeOrDateValid(selectedFromDate) ||
      !this.isTimeOrDateValid(selectedEndDate)
    )
      return callbackInvalidDate();

    if (
      !this.isTimeOrDateValid(selectedFromTime) ||
      !this.isTimeOrDateValid(selectedEndTime)
    )
      return callbackInvalidTime();

    const dateAndTimeValues = this.getFormattedDate();
    if (dateAndTimeValues.formatFromDate > dateAndTimeValues.formatEndDate)
      return callbackWrongDateAndTime();

    if (callbackAllIsOK) return callbackAllIsOK();
  };

  addOneHourTime = (time) => {
    if (time && !isNaN(time)) {
      let endTime = new Date(time);
      endTime.setHours(time.getHours() + 1);
      this.setState({
        selectedEndTime: endTime,
        selectedEndDate: endTime,
      });
    }
  };

  getFormattedDate = () => {
    const {
      selectedFromDate,
      selectedEndDate,
      selectedEndTime,
      selectedFromTime,
    } = this.state;
    let fromTime = new Date(selectedFromTime);
    let endTime = new Date(selectedEndTime);

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
      formatEndDate: formatEndDate,
    };

    return result;
  };

  inactivateSpatialSearchButtons = () => {
    this.setState({ isPolygonActive: false, isRectangleActive: false });
  };

  handlePolygonClick = () => {
    if (!this.state.spatialToolsEnabled) return;

    this.deactivateSearch();
    this.setState(
      {
        isPolygonActive: !this.state.isPolygonActive,
        isRectangleActive: false,
      },
      () => {
        if (this.state.isPolygonActive) this.activateSearch("Polygon");
      }
    );
    if (this.state.isPolygonActive) {
      this.localObserver.publish("vt-activate-search", () => {});
    }
  };

  handleRectangleClick = () => {
    if (!this.state.spatialToolsEnabled) return;

    this.deactivateSearch();
    this.setState(
      {
        isRectangleActive: !this.state.isRectangleActive,
        isPolygonActive: false,
      },
      () => {
        if (this.state.isRectangleActive) this.activateSearch("Box");
      }
    );
    if (this.state.isRectangleActive) {
      this.localObserver.publish("vt-activate-search", () => {});
    }
  };

  deactivateSearch = () => {
    this.localObserver.publish("vt-deactivate-search");
  };

  activateSearch = (spatialType) => {
    const { formatFromDate, formatEndDate } = this.getFormattedDate();

    this.localObserver.publish("vt-journeys-search", {
      selectedFromDate: formatFromDate,
      selectedEndDate: formatEndDate,
      selectedFormType: spatialType,
      searchCallback: this.inactivateSpatialSearchButtons,
    });
  };

  disableDrag = () => {
    this.localObserver.publish("vt-dragging-enabled", false);
  };

  enableDrag = () => {
    this.localObserver.publish("vt-dragging-enabled", true);
  };

  renderFromDateSection = () => {
    const { classes } = this.props;
    return (
      <>
        <Grid item xs={12}>
          <Typography variant="caption">FRÅN OCH MED</Typography>
          <KeyboardTimePicker
            format="HH:mm"
            margin="normal"
            id="time-picker"
            ampm={false}
            className={classes.dateForm}
            invalidDateMessage="FEL VÄRDE PÅ TID"
            keyboardIcon={<AccessTimeIcon></AccessTimeIcon>}
            value={this.state.selectedFromTime}
            onChange={this.handleFromTimeChange}
            KeyboardButtonProps={{
              "aria-label": "change time",
            }}
            onOpen={this.disableDrag}
            onClose={this.enableDrag}
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
            "aria-label": "change date",
          }}
          onOpen={this.disableDrag}
          onClose={this.enableDrag}
        />
      </>
    );
  };

  renderEndDateSection = () => {
    const { classes } = this.props;
    return (
      <>
        <Grid item xs={12}>
          <Typography variant="caption">TILL OCH MED</Typography>
          <KeyboardTimePicker
            format="HH:mm"
            margin="normal"
            ampm={false}
            className={classes.dateForm}
            invalidDateMessage="FEL VÄRDE PÅ TID"
            keyboardIcon={<AccessTimeIcon></AccessTimeIcon>}
            value={this.state.selectedEndTime}
            onChange={this.handleEndTimeChange}
            KeyboardButtonProps={{
              "aria-label": "change time",
            }}
            onOpen={this.disableDrag}
            onClose={this.enableDrag}
          />
        </Grid>
        <KeyboardDatePicker
          className={classes.spaceToFromDate}
          format="yyyy-MM-dd"
          margin="normal"
          invalidDateMessage="FEL VÄRDE PÅ DATUM"
          value={this.state.selectedEndDate}
          onChange={this.handleEndDateChange}
          KeyboardButtonProps={{
            "aria-label": "change date",
          }}
          onOpen={this.disableDrag}
          onClose={this.enableDrag}
        />
        {this.showErrorMessage()}
      </>
    );
  };

  showErrorMessage = () => {
    return this.validateDateAndTime(
      this.renderErrorMessageInvalidDate,
      this.renderErrorMessageInvalidTime,
      this.renderErrorMessageStartTimeBiggerThanEndTime,
      this.renderNoErrorMessage
    );
  };

  renderErrorMessageInvalidDate = () => {
    const { classes } = this.props;
    return (
      <Grid item xs={12}>
        <Typography variant="body2" className={classes.errorMessage}>
          DATUM MÅSTE ANGES
        </Typography>
      </Grid>
    );
  };

  renderErrorMessageInvalidTime = () => {
    const { classes } = this.props;
    return (
      <Grid item xs={12}>
        <Typography variant="body2" className={classes.errorMessage}>
          KLOCKSLAG MÅSTE ANGES
        </Typography>
      </Grid>
    );
  };

  renderErrorMessageStartTimeBiggerThanEndTime = () => {
    const { classes } = this.props;
    return (
      <Grid item xs={12}>
        <Typography variant="body2" className={classes.errorMessage}>
          TILL OCH MED FÅR INTE VARA MINDRE ÄN FRÅN OCH MED
        </Typography>
      </Grid>
    );
  };

  renderNoErrorMessage = () => {
    return <Typography></Typography>;
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
        <Grid justifyContent="center" container>
          <Grid item xs={4}>
            <div>
              <img
                src={
                  this.state.isPolygonActive ? ActivePolygon : InactivePolygon
                }
                onClick={this.handlePolygonClick}
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
                onClick={this.handleRectangleClick}
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
