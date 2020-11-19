import React from "react";
import { ThemeProvider, withStyles } from "@material-ui/core/styles";
import BaseWindowPlugin from "../../BaseWindowPlugin";
import DocumentViewer from "./DocumentViewer";
import PrintWindow from "../printMenu/PrintWindow";
import MenuBookIcon from "@material-ui/icons/MenuBook";
import Grid from "@material-ui/core/Grid";
import CircularProgress from "@material-ui/core/CircularProgress";
import { CustomLink } from "../utils/ContentComponentFactory";
import PrintIcon from "@material-ui/icons/Print";
const styles = (theme) => ({
  loader: {
    height: "100%",
  },
  progress: {
    height: "100%",
  },
});
class DocumentWindowBase extends React.PureComponent {
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
    const { documentTitle } = this.props;
    if (documentName) {
      if (documentName !== documentTitle) {
        this.props.showDocument(documentName).then(() => {
          this.scrollInDocument(headerIdentifier);
        });
      } else {
        this.scrollInDocument(headerIdentifier);
      }
    }
  };

  togglePrintWindow = () => {
    this.setState({
      showPrintWindow: !this.state.showPrintWindow,
    });
  };

  createHtmlObjectFromInfoClickEvent = () => {};

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

    app.globalObserver.subscribe(
      "documenthandler-searchresult-clicked",
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
    const {
      documentWindowMaximized,
      document,

      documentColor,
    } = this.props;
    return (
      <DocumentViewer
        documentColor={documentColor || "#ffffff"}
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
      classes,
      documentWindowMaximized,
      document,
      documentTitle,
      togglePrintWindow,
      onWindowHide,
      documentColor,
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
          title: documentTitle || options.windowTitle || "Documents",
          color: documentColor || "#ffffff",
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
              chapters={chapters}
              activeDocument={document}
              documentWindowMaximized={documentWindowMaximized}
              togglePrintWindow={togglePrintWindow}
              localObserver={localObserver}
              {...this.props}
            />
          )
        ) : (
          <Grid
            className={classes.loader}
            alignItems="center"
            justify="center"
            container
          >
            <CircularProgress className={classes.progress} justify="center" />
          </Grid>
        )}
      </BaseWindowPlugin>
    );
  }
}

export default withStyles(styles)(DocumentWindowBase);
