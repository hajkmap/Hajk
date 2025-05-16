import React from "react";
import { ThemeProvider, StyledEngineProvider } from "@mui/material/styles";
import BaseWindowPlugin from "../../BaseWindowPlugin";
import DocumentViewer from "./DocumentViewer";
import PrintWindow from "../printMenu/PrintWindow";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import Progress from "./Progress";
import { CustomLink } from "../utils/ContentComponentFactory";
import withSnackbar from "components/WithSnackbar";
import PrintIcon from "@mui/icons-material/Print";
import DownloadIcon from "@mui/icons-material/Download";
import PdfViewerWithTOC from "../pdfViewer/PdfViewerWithTOC";

class DocumentWindowBase extends React.PureComponent {
  snackbarKey = null;

  componentDidMount() {
    this.handleHashChange();
    window.addEventListener("hashchange", this.handleHashChange, false);
  }

  componentWillUnmount() {
    window.removeEventListener("hashchange", this.handleHashChange, false);
  }

  handleHashChange = () => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const title = params.get("title");
    const folder = params.get("folder");
    const pageStr = params.get("page");

    if (title) {
      const { localObserver } = this.props;
      window.pendingPage = pageStr ? Number(pageStr) : null;

      localObserver.publish("set-active-document", {
        documentName: title,
        headerIdentifier: null,
        folder,
      });
    }
  };

  shouldShowDocumentOnStart = () => {
    const { options } = this.props;
    return options.documentOnStart ? true : false;
  };

  scrollInDocument = (headerIdentifier) => {
    const { localObserver, model, document } = this.props;
    const headerRef = model.getHeaderRef(document, headerIdentifier);

    if (headerIdentifier) {
      // Determine which topic to use based on document type
      const topic =
        document.type === "pdf"
          ? "pdf-scroll-to-chapter"
          : document.type === "json"
            ? "json-scroll-to-chapter"
            : null;

      if (topic) {
        localObserver.publish(topic, headerRef);
      }
    } else {
      localObserver.publish("scroll-to-top", headerRef);
    }
  };

  showHeaderInDocument = ({ documentName, headerIdentifier }) => {
    const { enqueueSnackbar } = this.props;
    if (documentName) {
      this.props.showDocument(documentName).then(
        () => {
          this.scrollInDocument(headerIdentifier);
        },
        () => {
          enqueueSnackbar("Kunde inte öppna dokumentet", {
            variant: "warning",
          });

          console.warn(
            "Could not fetch document, link to document probably reference a document not present in panelmenu"
          );
        }
      );
    }
  };

  displayMaplinkLoadingBar = () => {
    const { enqueueSnackbar } = this.props;
    this.snackbarKey = enqueueSnackbar("Kartan laddar... ", {
      variant: "information",
      persist: true,
      preventDuplicate: true,
      transitionDuration: { enter: 0, exit: 0 },
      anchorOrigin: { vertical: "bottom", horizontal: "center" },
    });
  };

  closeMaplinkLoadingBar = () => {
    const { closeSnackbar } = this.props;
    closeSnackbar(this.snackbarKey);
  };

  togglePrintWindow = () => {
    this.setState({
      showPrintWindow: !this.state.showPrintWindow,
    });
  };

  toggleDownloadWindow = () => {
    this.setState({
      showDownloadWindow: !this.state.showDownloadWindow,
    });
  };

  handleInfoClickRequest = (infoClickEvent) => {
    const htmlObject = document.createElement("span");
    htmlObject.innerHTML = infoClickEvent.payload.replace(/\\/g, "");
    const aTag = htmlObject.getElementsByTagName("a")[0];
    if (aTag) {
      infoClickEvent.resolve(
        <CustomLink
          localObserver={this.props.localObserver}
          aTag={aTag}
          bottomMargin={false}
        ></CustomLink>
      );
    } else {
      console.error(
        "Could not render DocumentHandler link for payload:",
        infoClickEvent.payload
      );
      // Must resolve with a value, even null will do, but something more helpful could be nice.
      // The reason we must do it is because this value is used in React's render, and undefined will not render.
      infoClickEvent.resolve(<b>Could not render DocumentHandler link</b>);
    }
  };

  bindSubscriptions = () => {
    const { localObserver, app } = this.props;
    app.globalObserver.subscribe(
      "core.info-click-documenthandler",
      this.handleInfoClickRequest
    );
    localObserver.subscribe("set-active-document", this.showHeaderInDocument);
    localObserver.subscribe("maplink-loading", this.displayMaplinkLoadingBar);
    localObserver.subscribe(
      "map-animation-complete",
      this.closeMaplinkLoadingBar
    );
  };

  isModelReady = () => {
    const { model } = this.props;
    return model ? true : false;
  };

  componentDidUpdate = (prevProps, prevState) => {
    const { localObserver } = this.props;

    if (prevProps.model !== this.props.model) {
      if (this.isModelReady()) {
        this.bindSubscriptions();

        if (this.shouldShowDocumentOnStart()) {
          localObserver.publish("set-active-document", {
            documentName: this.props.options.documentOnStart,
            headerIdentifier: null,
          });
        }
      }
    }
  };

  getDocumentViewer = () => {
    const { documentWindowMaximized, document } = this.props;
    return (
      <DocumentViewer
        documentWindowMaximized={documentWindowMaximized}
        activeDocument={document}
        togglePrintWindow={this.togglePrintWindow}
        {...this.props}
      />
    );
  };

  render() {
    const {
      options,
      localObserver,
      documentWindowMaximized,
      document,
      togglePrintWindow,
      toggleDownloadWindow,
      onWindowHide,
      showPrintWindow,
      showDownloadWindow,
      customTheme,
      onMinimize,
      onMaximize,
      model,
      app,
    } = this.props;
    const modelReady = this.isModelReady();
    const customHeaderButtons = options.enablePrint
      ? [
          document?.type === "pdf"
            ? {
                icon: <DownloadIcon />,
                description: "Ladda ner PDF",
                onClickCallback: toggleDownloadWindow,
              }
            : {
                icon: <PrintIcon />,
                description: "Öppna utskrift",
                onClickCallback: togglePrintWindow,
              },
        ]
      : [];

    return (
      <BaseWindowPlugin
        {...this.props}
        type="DocumentViewer"
        custom={{
          icon: <MenuBookIcon />,
          title: document?.documentTitle || options.windowTitle || "Documents",
          color: document?.documentColor || "#ffffff",
          customPanelHeaderButtons: customHeaderButtons,
          description: "En kort beskrivning som visas i widgeten",
          height: options.height || "auto",
          width: options.width || 600,
          scrollable: false,
          onMinimize: onMinimize,
          onMaximize: onMaximize,
          onWindowHide: onWindowHide,
          draggingEnabled: options.draggingEnabled || false,
          resizingEnabled: options.resizingEnabled || false,
          allowMaximizedWindow: false,
        }}
      >
        {document != null && modelReady ? (
          document?.type === "pdf" ? (
            <PdfViewerWithTOC
              document={document}
              maximized={documentWindowMaximized}
              customTheme={customTheme}
              showDownloadWindow={showDownloadWindow}
              toggleDownloadWindow={toggleDownloadWindow}
              model={model}
              options={options}
              localObserver={localObserver}
              app={app}
            />
          ) : !showPrintWindow ? (
            customTheme ? (
              <StyledEngineProvider injectFirst>
                <ThemeProvider theme={customTheme}>
                  {this.getDocumentViewer()}
                </ThemeProvider>
              </StyledEngineProvider>
            ) : (
              this.getDocumentViewer()
            )
          ) : (
            <PrintWindow
              customTheme={customTheme}
              activeDocument={document}
              documentWindowMaximized={documentWindowMaximized}
              togglePrintWindow={togglePrintWindow}
              localObserver={localObserver}
              options={this.props.options}
              {...this.props}
            />
          )
        ) : (
          <Progress />
        )}
      </BaseWindowPlugin>
    );
  }
}

export default withSnackbar(DocumentWindowBase);
