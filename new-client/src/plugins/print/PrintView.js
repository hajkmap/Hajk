import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import PrintDialog from "./PrintDialog";
import { AppBar, Tab, Tabs } from "@material-ui/core";
import PrintIcon from "@material-ui/icons/Print";
import SettingsIcon from "@material-ui/icons/Settings";
import { Tooltip, Button } from "@material-ui/core";

import GeneralOptions from "./GeneralOptions";
import AdvancedOptions from "./AdvancedOptions";

const styles = (theme) => ({
  root: {
    margin: -10,
    display: "flex",
    flexDirection: "column",
    height: "100%",
  },
  stickyAppBar: {
    top: -10,
  },
  tabContent: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: theme.spacing(1),
    width: "100%",
    height: "100%",
  },
  printButtonContainer: {
    padding: theme.spacing(1),
  },
});

class PrintView extends React.PureComponent {
  static propTypes = {
    model: PropTypes.object.isRequired,
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
    scale: this.props.scales[Math.round((this.props.scales.length - 1) / 2)], // 10000 means scale of 1:10000
    mapTitle: "", // User can set a title that will get printed on the map
    printComment: "", // User can set a comment that will get printed on the map
    mapTextColor: "#FFFFFF", // Default color of text printed on the map
    printInProgress: false,
    previewLayerVisible: false,
    activeTab: 0,
    includeNorthArrow: this.props.options.includeNorthArrow ?? false,
    northArrowPlacement: this.props.options.northArrowPlacement || "topLeft",
    includeScaleBar: this.props.options.includeScaleBar ?? true,
    scaleBarPlacement: this.props.options.scaleBarPlacement || "bottomLeft",
    includeLogo: this.props.options.includeLogo ?? true,
    logoPlacement: this.props.options.logoPlacement || "topRight",
    saveAsType: "PDF",
  };

  snackbarKey = null;

  // Used to store some values that will be needed for resetting the map
  valuesToRestoreFrom = {};

  constructor(props) {
    super(props);
    this.model = this.props.model;
    this.localObserver = this.props.localObserver;
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

    props.localObserver.subscribe("print-failed-to-save", () => {
      this.props.closeSnackbar(this.snackbarKey);
      this.props.enqueueSnackbar(
        "Utskriften gick inte att spara, kontakta systemadministratören.",
        {
          variant: "error",
        }
      );
      this.setState({ printInProgress: false });
    });

    this.localObserver.subscribe("error-loading-logo-image", () => {
      this.props.enqueueSnackbar("Logotypbilden kunde inte laddas in.", {
        variant: "warning",
      });
    });

    this.localObserver.subscribe("error-loading-arrow-image", () => {
      this.props.enqueueSnackbar("Norrpilen kunde inte laddas in.", {
        variant: "warning",
      });
    });

    props.localObserver.subscribe("showPrintPreview", () => {
      const scale = this.model.getFittingScale();
      this.setState({ previewLayerVisible: true, scale: scale });
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
      mapTitle: this.state.mapTitle,
      printComment: this.state.printComment,
      mapTextColor: this.state.mapTextColor,
      includeLogo: this.state.includeLogo,
      logoPlacement: this.state.logoPlacement,
      includeScaleBar: this.state.includeScaleBar,
      scaleBarPlacement: this.state.scaleBarPlacement,
      includeNorthArrow: this.state.includeNorthArrow,
      northArrowPlacement: this.state.northArrowPlacement,
      saveAsType: this.state.saveAsType,
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
    const { scale, format, orientation, resolution, saveAsType } = this.state;

    return (
      <GeneralOptions
        scales={scales}
        scale={scale}
        format={format}
        resolution={resolution}
        orientation={orientation}
        handleChange={(event) => {
          this.handleChange(event);
        }}
        model={this.model}
        saveAsType={saveAsType}
      ></GeneralOptions>
    );
  };

  renderAdvancedOptions = () => {
    const {
      resolution,
      mapTitle,
      printComment,
      mapTextColor,
      includeNorthArrow,
      northArrowPlacement,
      includeScaleBar,
      scaleBarPlacement,
      includeLogo,
      logoPlacement,
    } = this.state;

    return (
      <AdvancedOptions
        resolution={resolution}
        mapTitle={mapTitle}
        printComment={printComment}
        mapTextColor={mapTextColor}
        handleChange={(event) => {
          this.handleChange(event);
        }}
        setMapTextColor={this.setMapTextColor}
        includeNorthArrow={includeNorthArrow}
        northArrowPlacement={northArrowPlacement}
        includeScaleBar={includeScaleBar}
        scaleBarPlacement={scaleBarPlacement}
        includeLogo={includeLogo}
        logoPlacement={logoPlacement}
      ></AdvancedOptions>
    );
  };

  render() {
    const { classes } = this.props;
    const {
      previewLayerVisible,
      scale,
      format,
      orientation,
      printInProgress,
      saveAsType,
      activeTab,
    } = this.state;

    this.model.renderPreviewFeature(previewLayerVisible, {
      scale: scale,
      format: format,
      orientation: orientation,
    });

    return (
      <>
        <div className={classes.root}>
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
              value={activeTab}
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
            {activeTab === 0 && this.renderGeneralOptions()}
            {activeTab === 1 && this.renderAdvancedOptions()}
            <div className={classes.printButtonContainer}>
              <Button
                variant="contained"
                fullWidth={true}
                color="primary"
                onClick={this.initiatePrint}
                disabled={printInProgress}
              >
                Skriv ut
              </Button>
            </div>
          </div>
        </div>
        <PrintDialog
          open={printInProgress}
          saveAsType={saveAsType}
          cancelPrint={this.cancelPrint}
        />
      </>
    );
  }
}

export default withStyles(styles)(withSnackbar(PrintView));
