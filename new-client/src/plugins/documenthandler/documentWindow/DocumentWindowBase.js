import React from "react";
import { withStyles } from "@material-ui/core/styles";
import BaseWindowPlugin from "../../BaseWindowPlugin";
import DocumentViewer from "./DocumentViewer";
import PrintWindow from "../printMenu/PrintWindow";
import MenuBookIcon from "@material-ui/icons/MenuBook";
import Grid from "@material-ui/core/Grid";
import CircularProgress from "@material-ui/core/CircularProgress";

const styles = (theme) => ({});

class DocumentWindowBase extends React.PureComponent {
  state = {
    counter: 0,
    document: null,
    documentWindowMaximized: true,
    showPrintWindow: false,
    chapters: [],
  };

  static propTypes = {};

  static defaultProps = {};

  setActiveDocument = (documentFileName) => {
    const { model } = this.props;
    return new Promise((resolve, reject) => {
      let document = model.getDocuments([documentFileName])[0];
      this.setState(
        {
          documentTitle: document.documentTitle,
          document: document,
          documentColor: document.documentColor ? document.documentColor : null,
          showPrintWindow: false,
        },
        resolve
      );
    });
  };

  onMinimize = () => {
    this.setState({ documentWindowMaximized: false });
  };

  onMaximize = () => {
    this.setState({ documentWindowMaximized: true });
  };

  findMenuItem(menuItem, documentNameToFind) {
    if (menuItem.document === documentNameToFind) {
      return menuItem;
    } else if (menuItem.menu && menuItem.menu.length > 0) {
      let i,
        result = null;
      for (i = 0; result == null && i < menuItem.menu.length; i++) {
        result = this.findMenuItem(menuItem.menu[i], documentNameToFind);
      }
      return result;
    }
    return null;
  }

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

  showDocument = (documentFileName) => {
    const { app } = this.props;
    app.globalObserver.publish("documentviewer.showWindow", {
      hideOtherPlugins: false,
    });
    app.globalObserver.publish("core.maximizeWindow");
    return this.setActiveDocument(documentFileName);
  };

  scrollInDocument = (headerIdentifier) => {
    const { localObserver, model } = this.props;
    if (headerIdentifier) {
      localObserver.publish(
        "scroll-to-chapter",
        model.getHeaderRef(this.state.document, headerIdentifier)
      );
    } else {
      localObserver.publish(
        "scroll-to-top",
        model.getHeaderRef(this.state.document, headerIdentifier)
      );
    }
  };

  showHeaderInDocument = ({ documentName, headerIdentifier }) => {
    if (documentName !== this.state.documentTitle) {
      this.showDocument(documentName).then(() => {
        this.scrollInDocument(headerIdentifier);
      });
    } else {
      this.scrollInDocument(headerIdentifier);
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
      return ["data-maplink", "data-document", "data-header"].includes(key);
    });
  };

  handleInfoClickRequest = (infoClickEvent) => {
    const { contentComponentFactory } = this.props;

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
      let link = contentComponentFactory.getLinkComponent(htmlObject);
      infoClickEvent.resolve(link);
    } else {
      infoClickEvent.resolve();
    }
  };

  bindListenForSearchResultClick = () => {
    const { app } = this.props;

    app.globalObserver.subscribe(
      "core.info-click-documenthandler",
      this.handleInfoClickRequest
    );

    app.globalObserver.subscribe(
      "documenthandler-searchresult-clicked",
      (searchResultClick) => {
        this.showHeaderInDocument({
          documentName: searchResultClick.properties.documentFileName,
          headerIdentifier: searchResultClick.properties.headerIdentifier,
        });
      }
    );
  };

  bindSubscriptions = () => {
    const { localObserver } = this.props;
    this.bindListenForSearchResultClick();
    localObserver.subscribe(
      "show-header-in-document",
      this.showHeaderInDocument
    );
    localObserver.subscribe("show-document", this.showDocument);
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
    return model;
  };

  componentDidUpdate = (prevProps, prevState) => {
    if (prevProps.model !== this.props.model) {
      if (this.isModelReady()) {
        this.bindSubscriptions();
      }
    }
  };

  render() {
    const {
      documentWindowMaximized,
      document,
      documentTitle,
      documentColor,
      showPrintWindow,
      chapters,
      localObserver,
    } = this.state;
    const { options, classes } = this.props;

    return (
      <BaseWindowPlugin
        {...this.props}
        type="DocumentViewer"
        custom={{
          icon: <MenuBookIcon />,
          title: documentTitle || options.windowTitle || "Documents",
          color: documentColor || "#ffffff",
          description: "En kort beskrivning som visas i widgeten",
          height: options.height || "auto",
          width: options.width || 600,
          scrollable: false,
          onMinimize: this.onMinimize,
          onMaximize: this.onMaximize,
          onResize: this.onResize,
          draggingEnabled: false,
          resizingEnabled: false,
          allowMaximizedWindow: false,
        }}
      >
        {document != null && this.isModelReady() ? (
          !showPrintWindow ? (
            <DocumentViewer
              documentColor={documentColor || "#ffffff"}
              documentWindowMaximized={documentWindowMaximized}
              activeDocument={document}
              togglePrintWindow={this.togglePrintWindow}
              {...this.props}
            />
          ) : (
            <PrintWindow
              chapters={chapters}
              activeDocument={document}
              documentWindowMaximized={documentWindowMaximized}
              togglePrintWindow={this.togglePrintWindow}
              localObserver={localObserver}
              {...this.props}
            />
          )
        ) : (
          <Grid
            style={{ height: "100%" }}
            className={classes.loader}
            alignItems="center"
            justify="center"
            container
          >
            <CircularProgress style={{ height: "100%" }} justify="center" />
          </Grid>
        )}
      </BaseWindowPlugin>
    );
  }
}

export default withStyles(styles)(DocumentWindowBase);
