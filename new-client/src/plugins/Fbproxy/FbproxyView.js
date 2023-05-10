import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import Button from "@material-ui/core/Button";
import CreateIcon from "@material-ui/icons/Create";
import CropDinIcon from "@material-ui/icons/CropDin";
import GestureIcon from "@material-ui/icons/Gesture";
import RadioButtonUncheckedIcon from "@material-ui/icons/RadioButtonUnchecked";
import ToggleButton from "@material-ui/lab/ToggleButton";
import ToggleButtonGroup from "@material-ui/lab/ToggleButtonGroup";
import MenuItem from "@material-ui/core/MenuItem";
import FormHelperText from "@material-ui/core/FormHelperText";
import FormControl from "@material-ui/core/FormControl";
import Select from "@material-ui/core/Select";

// Define JSS styles that will be used in this component.
// Example below utilizes the very powerful "theme" object
// that gives access to some constants, see: https://material-ui.com/customization/default-theme/
const styles = (theme) => ({
  buttonWithBottomMargin: {
    marginBottom: theme.spacing(2),
  },
  drawerContent: {
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
  },
});

class DummyView extends React.PureComponent {
  // Initialize state - this is the correct way of doing it nowadays.
  state = {
    mode: null,
    action: "",
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
    enqueueSnackbar: PropTypes.func.isRequired,
    closeSnackbar: PropTypes.func.isRequired,
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

  // Event handler for a button that shows a global info message when clicked
  showDefaultSnackbar = () => {
    this.props.enqueueSnackbar("Yay, a nice message with default styling.");
  };

  // A more complicate snackbar example, this one with an action button and persistent snackbar
  showAdvancedSnackbar = () => {
    const action = (key) => (
      <>
        <Button
          onClick={() => {
            alert(`I belong to snackbar with key ${key}`);
          }}
        >
          {"Alert"}
        </Button>
        <Button
          onClick={() => {
            this.props.closeSnackbar(key);
          }}
        >
          {"Dismiss"}
        </Button>
      </>
    );

    this.props.enqueueSnackbar("Oops, a message with error styling!", {
      variant: "error",
      persist: true,
      action,
    });
  };

  handleModeChange = (event, mode) => {
    this.setState({ mode });
    this.model.activate(mode);
  };

  handleActionChange = (event) => {
    this.setState({ action: event.target.value });
  };

  handleLoad = () => {
    this.model.load(this.state.action);
  };

  render() {
    const { classes } = this.props;
    return (
      <>
        <Typography variant="caption">Selection mode</Typography>
        <ToggleButtonGroup
          value={this.state.mode}
          exclusive
          onChange={this.handleModeChange}
          aria-label="draw mode"
        >
          <ToggleButton value="select" disabled aria-label="select feature">
            <CreateIcon />
          </ToggleButton>
          <ToggleButton
            value="polygon"
            aria-label="select by drawing a polygon"
            disabled
          >
            <CropDinIcon />
          </ToggleButton>
          <ToggleButton value="circle" aria-label="select by drawing a circle">
            <RadioButtonUncheckedIcon />
          </ToggleButton>
          <ToggleButton
            value="freehand"
            aria-label="select by freehand drawing"
            disabled
          >
            <GestureIcon />
          </ToggleButton>
        </ToggleButtonGroup>

        <FormControl className={classes.formControl}>
          <Select
            value={this.state.action}
            onChange={this.handleActionChange}
            displayEmpty
            className={classes.selectEmpty}
            inputProps={{ "aria-label": "Without label" }}
          >
            <MenuItem value="" disabled>
              Befolkning
            </MenuItem>
            <MenuItem value={"befolkning/search/franPunkt"}>
              Invånare utifrån en buffer runt en punkt
            </MenuItem>

            <MenuItem value="" disabled>
              Byggnad
            </MenuItem>
            <MenuItem value={"byggnad/search/franPunkt"}>
              Byggnader inom buffer från en punkt
            </MenuItem>

            <MenuItem value="" disabled>
              Fastigheter
            </MenuItem>
            <MenuItem value={"fastighet/search/franPunkt"}>
              Fastigheter inom buffer från en punkt
            </MenuItem>
            <MenuItem value={20}>Twenty</MenuItem>
            <MenuItem value={30}>Thirty</MenuItem>
          </Select>
          <FormHelperText>Action</FormHelperText>
        </FormControl>

        <Button onClick={this.handleLoad}>Go!</Button>
      </>
    );
  }
}

// Exporting like this adds some props to DummyView.
// withStyles will add a 'classes' prop, while withSnackbar
// adds to functions (enqueueSnackbar() and closeSnackbar())
// that can be used throughout the Component.
export default withStyles(styles)(withSnackbar(DummyView));
