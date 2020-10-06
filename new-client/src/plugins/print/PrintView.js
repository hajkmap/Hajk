import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import PrintDialog from "./PrintDialog";
import { AppBar, Tab, Tabs } from "@material-ui/core";
import PrintIcon from "@material-ui/icons/Print";
import SettingsIcon from "@material-ui/icons/Settings";
import { Tooltip } from "@material-ui/core";

import GeneralOptions from "./GeneralOptions";
import AdvancedOptions from "./AdvancedOptions";

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
  windowContent: {
    margin: -10,
  },
  stickyAppBar: {
    top: -10,
  },
  tabContent: {
    padding: 10,
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
    activeTab: 0,
  };

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

  handleChange = (event) => {
    this.setState({
      [event.target.name]: event.target.value,
    });
  };

  setMapTextColor = (color) => {
    this.setState({ mapTextColor: color.hex });
  };

  handleChangeTabs = (event, activeTab) => {
    this.setState({ activeTab });
  };

  handleTabsMounted = (ref) => {
    setTimeout(() => {
      ref !== null && ref.updateIndicator();
    }, 1);
  };

  renderGeneralOptions = () => {
    const { scales } = this.props;
    const {
      scale,
      format,
      orientation,
      resolution,
      mapTitle,
      mapTextColor,
      printInProgress,
    } = this.state;

    return (
      <GeneralOptions
        scales={scales}
        scale={scale}
        format={format}
        resolution={resolution}
        orientation={orientation}
        mapTitle={mapTitle}
        mapTextColor={mapTextColor}
        handleChange={(event) => {
          this.handleChange(event);
        }}
        initiatePrint={this.initiatePrint}
        model={this.model}
        setMapTextColor={this.setMapTextColor}
        printInProgress={printInProgress}
      ></GeneralOptions>
    );
  };

  renderAdvancedOptions = () => {
    const { scales } = this.props;
    const {
      scale,
      format,
      orientation,
      resolution,
      mapTitle,
      mapTextColor,
      printInProgress,
    } = this.state;

    return (
      <AdvancedOptions
        scales={scales}
        scale={scale}
        format={format}
        resolution={resolution}
        orientation={orientation}
        mapTitle={mapTitle}
        mapTextColor={mapTextColor}
        handleChange={(event) => {
          this.handleChange(event);
        }}
        initiatePrint={this.initiatePrint}
        model={this.model}
        setMapTextColor={this.setMapTextColor}
        printInProgress={printInProgress}
      ></AdvancedOptions>
    );
  };

  render() {
    const { classes } = this.props;
    const { previewLayerVisible, scale, format, orientation } = this.state;

    this.model.renderPreviewFeature(previewLayerVisible, {
      scale: scale,
      format: format,
      orientation: orientation,
    });

    return (
      <>
        <div className={classes.windowContent}>
          <AppBar
            position="sticky"
            color="default"
            className={classes.stickyAppBar}
          >
            <Tabs
              action={this.handleTabsMounted}
              indicatorColor="primary"
              onChange={this.handleChangeTabs}
              textColor="primary"
              value={this.state.activeTab}
              variant="fullWidth"
            >
              <Tooltip title="Generella inställningar">
                <Tab icon={<PrintIcon />} />
              </Tooltip>
              <Tooltip title="Avancerade inställningar">
                <Tab icon={<SettingsIcon />} />
              </Tooltip>
            </Tabs>
          </AppBar>
          <div className={classes.tabContent}>
            {this.state.activeTab === 0 && this.renderGeneralOptions()}
            {this.state.activeTab === 1 && this.renderAdvancedOptions()}
          </div>
        </div>
        <PrintDialog
          open={this.state.printInProgress}
          cancelPrint={this.cancelPrint}
        />
      </>
    );
  }
}

export default withStyles(styles)(withSnackbar(PrintView));
