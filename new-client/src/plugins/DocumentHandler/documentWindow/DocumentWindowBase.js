import React from "react";
import { ThemeProvider } from "@material-ui/core/styles";
import BaseWindowPlugin from "../../BaseWindowPlugin";
import DocumentViewer from "./DocumentViewer";
import PrintWindow from "../printMenu/PrintWindow";
import MenuBookIcon from "@material-ui/icons/MenuBook";
import Progress from "./Progress";
import { CustomLink } from "../utils/ContentComponentFactory";
import { withSnackbar } from "notistack";
import PrintIcon from "@material-ui/icons/Print";

class DocumentWindowBase extends React.PureComponent {
  //Could be rewritten
  findMenuItem(menuItem, documentNameToFind) {
    if (menuItem.document === documentNameToFind) {
      return menuItem;
    } else if (this.hasSubMenu(menuItem)) {
      let i,
        result = null;
      for (i = 0; result == null && i < menuItem.menu.length; i++) {
        result = this.findMenuItem(menuItem.menu[i], documentNameToFind);
      }
      return result;
    }
    return null;
  }

  hasSubMenu = (menuItem) => {
    return menuItem.menu && menuItem.menu.length > 0;
  };

  findReferringMenuItem = (documentNameToFind) => {
    const { options } = this.props;
    let foundMenuItem = null;
    options.menuConfig.menu.forEach((rootItemToSearch) => {
      let found = this.findMenuItem(rootItemToSearch, documentNameToFind);
      if (found != null) {
        foundMenuItem = found;
      }
    });
    return foundMenuItem;
  };

  shouldShowDocumentOnStart = () => {
    const { options } = this.props;
    return options.documentOnStart ? true : false;
  };

  scrollInDocument = (headerIdentifier) => {
    const { localObserver, model, document } = this.props;

    if (headerIdentifier) {
      localObserver.publish(
        "scroll-to-chapter",
        model.getHeaderRef(document, headerIdentifier)
      );
    } else {
      localObserver.publish(
        "scroll-to-top",
        model.getHeaderRef(document, headerIdentifier)
      );
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

  togglePrintWindow = () => {
    this.setState({
      showPrintWindow: !this.state.showPrintWindow,
    });
  };

  canHandleInfoClickEvent = (infoClickEvent) => {
    if (infoClickEvent.payload.type !== "a") {
      return false;
    }
    return Object.keys(infoClickEvent.payload.dataAttributes).every((key) => {
      return [
        "data-maplink",
        "data-document",
        "data-header-identifier",
      ].includes(key);
    });
  };

  handleInfoClickRequest = (infoClickEvent) => {
    if (this.canHandleInfoClickEvent(infoClickEvent)) {
      var htmlObject = document.createElement(infoClickEvent.payload.type);
      htmlObject.innerHTML = infoClickEvent.payload.children[0];
      Object.entries(infoClickEvent.payload.dataAttributes).forEach(
        (dataAttributeEntry) => {
          var att = document.createAttribute(dataAttributeEntry[0]);
          att.value = dataAttributeEntry[1];
          htmlObject.setAttributeNode(att);
        }
      );
      let link = (
        <CustomLink
          localObserver={this.props.localObserver}
          aTag={htmlObject}
          bottomMargin={false}
        ></CustomLink>
      );
      infoClickEvent.resolve(link);
    } else {
      infoClickEvent.resolve();
    }
  };

  bindListenForSearchResultClick = () => {
    const { app, localObserver } = this.props;

    // The event published from the search component will be prepended
    // with "search.featureClicked", therefore we have to subscribe
    // to search.featureClicked.onClickName to catch the event.
    app.globalObserver.subscribe(
      "search.featureClicked.documentHandlerSearchResultClicked",
      (searchResultClick) => {
        localObserver.publish("set-active-document", {
          documentName: searchResultClick.properties.documentFileName,
          headerIdentifier: searchResultClick.properties.headerIdentifier,
        });
      }
    );

    app.globalObserver.subscribe(
      "core.info-click-documenthandler",
      this.handleInfoClickRequest
    );
  };

  bindSubscriptions = () => {
    const { localObserver } = this.props;
    this.bindListenForSearchResultClick();
    localObserver.subscribe("set-active-document", this.showHeaderInDocument);
  };

  setChapterLevels(chapter, level) {
    chapter.level = level;
    if (chapter.chapters && chapter.chapters.length > 0) {
      level = level + 1;
      chapter.chapters.forEach((subChapter) => {
        subChapter = this.setChapterLevels(subChapter, level);
      });
    }
    return chapter;
  }

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
      chapters,
      localObserver,
      documentWindowMaximized,
      document,
      togglePrintWindow,
      onWindowHide,
      showPrintWindow,
      customTheme,
      onMinimize,
      onMaximize,
    } = this.props;
    const modelReady = this.isModelReady();
    const customHeaderButtons = options.enablePrint
      ? [
          {
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
          draggingEnabled: false,
          resizingEnabled: false,
          allowMaximizedWindow: false,
        }}
      >
        {document != null && modelReady ? (
          !showPrintWindow ? (
            customTheme ? (
              <ThemeProvider theme={customTheme}>
                {this.getDocumentViewer()}
              </ThemeProvider>
            ) : (
              this.getDocumentViewer()
            )
          ) : (
            <PrintWindow
              customTheme={customTheme}
              chapters={chapters}
              activeDocument={document}
              documentWindowMaximized={documentWindowMaximized}
              togglePrintWindow={togglePrintWindow}
              localObserver={localObserver}
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
