import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import { Button } from "@material-ui/core";
import Grid from "@material-ui/core/Grid";
import BorderStyleIcon from "@material-ui/icons/BorderStyle";
import SquareIcon from "@material-ui/icons/CropSquare";
import DateFnsUtils from "@date-io/date-fns";
import {
  MuiPickersUtilsProvider,
  KeyboardTimePicker,
  KeyboardDatePicker
} from "@material-ui/pickers";

// Define JSS styles that will be used in this component.
// Examle below utilizes the very powerful "theme" object
// that gives access to some constants, see: https://material-ui.com/customization/default-theme/
const styles = theme => ({
  KeyboardDatePicker: {
    paddingBottom: 10
  },
  MuiPickersUtilsProvider: { width: 150 },
  Button: {
    paddingLeft: 3
  }
});

//TODO - Only mockup //Tobias

class Journeys extends React.PureComponent {
  // Initialize state - this is the correct way of doing it nowadays.
  state = {
    fromTime: null,
    activeTool: undefined,
    selectedFromDate: new Date(),
    selectedEndDate: new Date()
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
    this.setState({
      selectedFromDate: date
    });
  };
  handleEndDateChange = date => {
    this.setState({
      selectedEndDate: date
    });
  };

  render() {
    const { classes } = this.props;

    return (
      <div>
        <div>Här ska vi lägga till formuläret för turer</div>

        <MuiPickersUtilsProvider utils={DateFnsUtils}>
          <Grid container justify="space-around">
            <KeyboardDatePicker
              format="yyyy-MM-dd"
              margin="normal"
              id="date-picker-inline"
              label="Från och med"
              value={this.state.selectedFromDate}
              onChange={this.handleFromDateChange}
              KeyboardButtonProps={{
                "aria-label": "change date"
              }}
            />
            <KeyboardTimePicker
              margin="normal"
              id="time-picker"
              ampm={false}
              value={this.state.selectedFromDate}
              onChange={this.handleFromDateChange}
              KeyboardButtonProps={{
                "aria-label": "change time"
              }}
            />
            <KeyboardDatePicker
              format="yyyy-MM-dd"
              margin="normal"
              id="date-picker-inline"
              label="Till och med"
              value={this.state.selectedEndDate}
              onChange={this.handleEndDateChange}
              KeyboardButtonProps={{
                "aria-label": "change date"
              }}
            />
            <KeyboardTimePicker
              margin="normal"
              id="time-picker"
              ampm={false}
              value={this.state.selectedEndDate}
              onChange={this.handleEndDateChange}
              KeyboardButtonProps={{
                "aria-label": "change time"
              }}
            />
          </Grid>
        </MuiPickersUtilsProvider>
        <p>Markera sökområde i kartan</p>
        <Button
          variant="outlined"
          className={classes.button}
          type="button"
          title="Lägg till polygon"
        >
          Polygon
          <BorderStyleIcon className={classes.leftIcon} />
        </Button>
        <Button
          variant="outlined"
          className={classes.button}
          type="button"
          title="Lägg till rektangel"
        >
          Rektangel
          <SquareIcon className={classes.leftIcon} />
        </Button>
      </div>
    );
  }
}

// Exporting like this adds some props to DummyView.
// withStyles will add a 'classes' prop, while withSnackbar
// adds to functions (enqueueSnackbar() and closeSnackbar())
// that can be used throughout the Component.
export default withStyles(styles)(Journeys);
