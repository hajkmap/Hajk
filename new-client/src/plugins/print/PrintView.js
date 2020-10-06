import React from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  TextField,
  Popover,
  Tooltip,
  IconButton,
  FormControlLabel,
} from "@material-ui/core";
import PaletteIcon from "@material-ui/icons/Palette";
import { TwitterPicker as ColorPicker } from "react-color";

const styles = (theme) => ({
  root: {
    display: "flex",
    flexWrap: "wrap",
  },
  formControl: {
    margin: theme.spacing(1),
    minWidth: 225,
  },
  mapTextColorLabel: {
    margin: 0,
  },
});

class PrintView extends React.PureComponent {
  static propTypes = {
    model: PropTypes.object.isRequired,
    app: PropTypes.object.isRequired,
    localObserver: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
    enqueueSnackbar: PropTypes.func.isRequired,
    closeSnackbar: PropTypes.func.isRequired,
  };

  static defaultProps = {};

  state = {
    format: "a4", // a0-a5
    orientation: "landscape",
    resolution: 150, // 72, 150, 300,
    scale: 10000, // 10000 means scale of 1:10000
    mapTitle: "", // User can set a title that will get printed on the map
    mapTextColor: "#ffffff", // Default color of text printed on the map
    printInProgress: false,
    previewLayerVisible: false,
  };

  // Default colors for color picker used to set text color (used in map title, scale, etc)
  mapTextAvailableColors = [
    "#FFFFFF",
    "#D0021B",
    "#F5A623",
    "#F8E71C",
    "#8B572A",
    "#7ED321",
    "#417505",
    "#9013FE",
    "#4A90E2",
    "#50E3C2",
    "#B8E986",
    "#000000",
    "#4A4A4A",
    "#9B9B9B",
  ];

  snackbarKey = null;

  // Used to store some values that will be needed for resetting the map
  valuesToRestoreFrom = {};

  constructor(props) {
    super(props);
    this.model = this.props.model;
    this.localObserver = this.props.localObserver;
    this.globalObserver = this.props.app.globalObserver;
    this.map = this.props.map;
    this.dims = this.props.dims;

    // Add the preview layer to map (it doesn't contain any features yet!)
    this.model.addPreviewLayer();

    // If plugin is visible at start, ensure we show the preview feature too
    if (props.visibleAtStart === true) this.state.previewLayerVisible = true;

    props.localObserver.subscribe("print-completed", () => {
      this.props.closeSnackbar(this.snackbarKey);
      this.props.enqueueSnackbar("Din utskrift är klar!", {
        variant: "success",
      });
      this.setState({ printInProgress: false });
    });

    this.localObserver.subscribe("error-loading-logo-image", () => {
      this.props.enqueueSnackbar("Logotypbilden kunde inte laddas in.", {
        variant: "warning",
      });
    });

    props.localObserver.subscribe("showPrintPreview", () => {
      this.setState({ previewLayerVisible: true });
    });

    props.localObserver.subscribe("hidePrintPreview", () => {
      this.setState({ previewLayerVisible: false });
    });
  }

  initiatePrint = (e) => {
    // Print can be initiated by submitting the <form>. In that case, we must prevent default behavior.
    e.preventDefault();
    // Print starts, tell the user
    this.setState({ printInProgress: true });
    this.snackbarKey = this.props.enqueueSnackbar(
      "Utskrift pågår – var god vänta…",
      {
        variant: "info",
        persist: true,
      }
    );

    this.valuesToRestoreFrom = {
      snackbarKey: this.snackbarKey,
    };

    let printOptions = {
      format: this.state.format,
      orientation: this.state.orientation,
      resolution: this.state.resolution,
      scale: this.state.scale,
      mapTextColor: this.state.mapTextColor,
      mapTitle: this.state.mapTitle,
    };

    this.model.print(printOptions);
  };

  /**
   * @summary Make it possible to cancel a printout by clicking a button.
   *
   */
  cancelPrint = () => {
    this.model.cancelPrint();

    // Print done, hide messages
    this.props.closeSnackbar(this.valuesToRestoreFrom.snackbarKey);
    this.props.enqueueSnackbar(
      "Du avbröt utskriften – ingen data har sparats",
      {
        variant: "warning",
      }
    );
    this.setState({ printInProgress: false });
  };

  /**
   * @summary Take care of handling state of our resolution and format dropdowns.
   *
   * @param {Object} event
   */
  handleChange = (event) => {
    this.setState({
      [event.target.name]: event.target.value,
    });
  };

  toggleColorPicker = (e) => {
    this.setState({ anchorEl: e.currentTarget });
  };

  hideColorPicker = (e) => {
    this.setState({ anchorEl: null });
  };

  handleMapTextColorChangeComplete = (color) => {
    this.hideColorPicker();
    this.setState({ mapTextColor: color.hex });
  };

  render() {
    const { classes, scales } = this.props;
    const { previewLayerVisible, scale, format, orientation } = this.state;

    this.model.renderPreviewFeature(previewLayerVisible, {
      scale: scale,
      format: format,
      orientation: orientation,
    });

    return (
      <>
        {createPortal(
          <Dialog
            disableBackdropClick={true}
            disableEscapeKeyDown={true}
            open={this.state.printInProgress}
          >
            <LinearProgress />
            <DialogTitle>Din PDF skapas</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Det här kan ta en stund, speciellt om du har valt ett stort
                format (A2-A3) och hög upplösning (>72 dpi). Men när allt är
                klart kommer PDF-filen att laddas ner till din dator.
                <br />
                <br />
                Om du inte vill vänta längre kan du avbryta utskriften genom att
                trycka på knappen nedan.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button variant="contained" onClick={this.cancelPrint}>
                Avbryt
              </Button>
            </DialogActions>
          </Dialog>,
          document.getElementById("root")
        )}
        <form
          className={classes.root}
          autoComplete="off"
          onSubmit={this.initiatePrint}
        >
          <FormControl className={classes.formControl}>
            <InputLabel htmlFor="format">Format</InputLabel>
            <Select
              value={this.state.format}
              onChange={this.handleChange}
              inputProps={{
                name: "format",
                id: "format",
              }}
            >
              <MenuItem value={"a2"}>A2</MenuItem>
              <MenuItem value={"a3"}>A3</MenuItem>
              <MenuItem value={"a4"}>A4</MenuItem>
              <MenuItem value={"a5"}>A5</MenuItem>
            </Select>
          </FormControl>
          <FormControl className={classes.formControl}>
            <InputLabel htmlFor="orientation">Orientering</InputLabel>
            <Select
              value={this.state.orientation}
              onChange={this.handleChange}
              inputProps={{
                name: "orientation",
                id: "orientation",
              }}
            >
              <MenuItem value={"landscape"}>Liggande</MenuItem>
              <MenuItem value={"portrait"}>Stående</MenuItem>
            </Select>
          </FormControl>
          <FormControl className={classes.formControl}>
            <InputLabel htmlFor="resolution">Upplösning (DPI)</InputLabel>
            <Select
              value={this.state.resolution}
              onChange={this.handleChange}
              inputProps={{
                name: "resolution",
                id: "resolution",
              }}
            >
              <MenuItem value={72}>72</MenuItem>
              <MenuItem value={150}>150</MenuItem>
              <MenuItem value={300}>300</MenuItem>
            </Select>
          </FormControl>
          <FormControl className={classes.formControl}>
            <InputLabel htmlFor="scale">Skala</InputLabel>
            <Select
              value={this.state.scale}
              onChange={this.handleChange}
              inputProps={{
                name: "scale",
                id: "scale",
              }}
            >
              {scales.map((scale, i) => {
                // Note: it is crucial to keep the scale value (in state) divided by 1000 from what is shown to user!
                return (
                  <MenuItem key={i} value={scale}>
                    {this.model.getUserFriendlyScale(scale)}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          <FormControl className={classes.formControl}>
            <TextField
              value={this.state.mapTitle}
              onChange={this.handleChange}
              label="Valfri titel"
              placeholder="Kan lämnas tomt"
              variant="standard"
              inputProps={{
                id: "mapTitle",
                name: "mapTitle",
              }}
            />
          </FormControl>
          <FormControl className={classes.formControl}>
            <Tooltip title="Textfärg påverkar inte kartans etiketter utan styr endast färgen för kringliggande texter, så som titel, copyrighttext, etc.">
              <FormControlLabel
                value="mapTextColor"
                className={classes.mapTextColorLabel}
                control={
                  <IconButton
                    id="mapTextColor"
                    onClick={this.toggleColorPicker}
                    style={{
                      backgroundColor: this.state.mapTextColor,
                      marginRight: 4,
                    }}
                    size="small"
                    edge="start"
                  >
                    <PaletteIcon />
                  </IconButton>
                }
                label="Textfärg"
              />
            </Tooltip>
          </FormControl>

          <Popover
            id="color-picker-menu"
            anchorEl={this.state.anchorEl}
            open={Boolean(this.state.anchorEl)}
            onClose={this.hideColorPicker}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "center",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "center",
            }}
          >
            <ColorPicker
              color={this.state.mapTextColor}
              colors={this.mapTextAvailableColors}
              onChangeComplete={this.handleMapTextColorChangeComplete}
            />
          </Popover>
          <FormControl className={classes.formControl}>
            <Button
              variant="contained"
              fullWidth={true}
              color="primary"
              onClick={this.initiatePrint}
              disabled={this.state.printInProgress}
            >
              Skriv ut
            </Button>
          </FormControl>
        </form>
      </>
    );
  }
}

export default withStyles(styles)(withSnackbar(PrintView));
