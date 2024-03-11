import React from "react";
import PropTypes from "prop-types";
import { styled } from "@mui/material/styles";
import { withSnackbar } from "notistack";
import PrintDialog from "./PrintDialog";
import { AppBar, Tab, Tabs } from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import SettingsIcon from "@mui/icons-material/Settings";
import { Tooltip, Button } from "@mui/material";

import GeneralOptions from "./GeneralOptions";
import AdvancedOptions from "./AdvancedOptions";

const Root = styled("div")(() => ({
  margin: -10,
  display: "flex",
  flexDirection: "column",
  height: "100%",
}));

const StyledAppBar = styled(AppBar)(() => ({
  top: -10,
}));

const TabContent = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  padding: theme.spacing(1),
  width: "100%",
  height: "100%",
}));

const PrintButtonContainer = styled("div")(({ theme }) => ({
  padding: theme.spacing(1),
}));

class PrintView extends React.PureComponent {
  static propTypes = {
    model: PropTypes.object.isRequired,
    localObserver: PropTypes.object.isRequired,
    enqueueSnackbar: PropTypes.func.isRequired,
    closeSnackbar: PropTypes.func.isRequired,
  };

  static defaultProps = {};

  state = {
    format: "a4", // a0-a5
    useMargin: this.props.options.useMargin ?? false, // User can choose to have a margin around the map-image
    useTextIconsInMargin: this.props.options.useTextIconsInMargin ?? false,
    orientation: "landscape",
    resolution: 150, // 72, 150, 300,
    scale: this.props.scales[Math.round((this.props.scales.length - 1) / 2)], // 10000 means scale of 1:10000
    mapTitle: "", // User can set a title that will get printed on the map
    printComment: "", // User can set a comment that will get printed on the map
    mapTextColor: this.props.options.mapTextColor ?? "#FFFFFF", // Default color of text printed on the map
    printInProgress: false,
    previewLayerVisible: false,
    activeTab: 0,
    includeNorthArrow: this.props.options.includeNorthArrow ?? false,
    northArrowPlacement: this.props.options.northArrowPlacement || "topLeft",
    includeScaleBar: this.props.options.includeScaleBar ?? true,
    scaleBarPlacement: this.props.options.scaleBarPlacement || "bottomLeft",
    includeLogo: this.props.options.includeLogo ?? true,
    logoPlacement: this.props.options.logoPlacement || "topRight",
    includeQrCode: this.props.options.includeQrCode ?? false,
    qrCodePlacement: this.props.options.qrCodePlacement || "topRight",
    saveAsType: "PDF",
    printOptionsOk: false,
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
      this.setState({ previewLayerVisible: true, scale: scale }, () => {
        this.handlePotentialPrintOptionError();
      });
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

    const printOptions = this.getPrintOptions();
    this.model.print(printOptions);
  };

  getPrintOptions = () => {
    return {
      useMargin: this.state.useMargin,
      useTextIconsInMargin: this.state.useTextIconsInMargin,
      format: this.state.format,
      orientation: this.state.orientation,
      resolution: this.state.resolution,
      scale: this.state.scale,
      mapTitle: this.state.mapTitle,
      printComment: this.state.printComment,
      mapTextColor: this.state.mapTextColor,
      includeLogo: this.state.includeLogo,
      logoPlacement: this.state.logoPlacement,
      includeQrCode: this.state.includeQrCode,
      qrCodePlacement: this.state.qrCodePlacement,
      includeScaleBar: this.state.includeScaleBar,
      scaleBarPlacement: this.state.scaleBarPlacement,
      includeNorthArrow: this.state.includeNorthArrow,
      northArrowPlacement: this.state.northArrowPlacement,
      saveAsType: this.state.saveAsType,
    };
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
    this.setState(
      {
        [event.target.name]: event.target.value,
      },
      () => {
        this.handlePotentialPrintOptionError();
      }
    );
  };

  handlePotentialPrintOptionError = () => {
    const printOptions = this.getPrintOptions();
    const printOptionsOk = this.model.desiredPrintOptionsOk(printOptions);
    this.setState({ printOptionsOk: printOptionsOk });
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
      useMargin,
      useTextIconsInMargin,
      format,
      orientation,
      resolution,
      saveAsType,
      printOptionsOk,
    } = this.state;

    return (
      <GeneralOptions
        scales={scales}
        useMargin={useMargin}
        useTextIconsInMargin={useTextIconsInMargin}
        scale={scale}
        format={format}
        resolution={resolution}
        orientation={orientation}
        handleChange={(event) => {
          this.handleChange(event);
        }}
        model={this.model}
        saveAsType={saveAsType}
        printOptionsOk={printOptionsOk}
        options={this.props.options}
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
      includeQrCode,
      qrCodePlacement,
      printOptionsOk,
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
        includeQrCode={includeQrCode}
        qrCodePlacement={qrCodePlacement}
        printOptionsOk={printOptionsOk}
        options={this.props.options}
        enableAppStateInHash={this.props.enableAppStateInHash}
      ></AdvancedOptions>
    );
  };

  a11yProps(index) {
    return {
      id: `print-tab-${index}`,
      "aria-controls": `print-tab-${index}`,
    };
  }

  render() {
    const { windowVisible } = this.props;
    const {
      previewLayerVisible,
      scale,
      useMargin,
      useTextIconsInMargin,
      format,
      orientation,
      printInProgress,
      saveAsType,
      activeTab,
      printOptionsOk,
    } = this.state;

    this.model.renderPreviewFeature(previewLayerVisible, {
      scale: scale,
      format: format,
      orientation: orientation,
      useMargin: useMargin,
      useTextIconsInMargin: useTextIconsInMargin,
    });

    return (
      <>
        <Root>
          <StyledAppBar position="sticky" color="default">
            <Tabs
              action={this.handleTabsMounted}
              onChange={this.handleChangeTabs}
              value={windowVisible ? activeTab : false} // If the window is not visible,
              // we cannot send a proper value to the tabs-component. If we do, mui will throw an error.
              // false is OK though, apparently.
              variant="fullWidth"
              textColor="inherit"
            >
              <Tooltip disableInteractive title="Generella inställningar">
                <Tab icon={<PrintIcon />} {...this.a11yProps(0)} />
              </Tooltip>
              <Tooltip disableInteractive title="Avancerade inställningar">
                <Tab icon={<SettingsIcon />} {...this.a11yProps(1)} />
              </Tooltip>
            </Tabs>
          </StyledAppBar>
          <TabContent>
            {activeTab === 0 && this.renderGeneralOptions()}
            {activeTab === 1 && this.renderAdvancedOptions()}
            <PrintButtonContainer>
              <Button
                variant="contained"
                fullWidth={true}
                color="primary"
                onClick={this.initiatePrint}
                disabled={printInProgress || !printOptionsOk}
              >
                Skriv ut
              </Button>
            </PrintButtonContainer>
          </TabContent>
        </Root>
        <PrintDialog
          open={printInProgress}
          saveAsType={saveAsType}
          cancelPrint={this.cancelPrint}
        />
      </>
    );
  }
}

export default withSnackbar(PrintView);
