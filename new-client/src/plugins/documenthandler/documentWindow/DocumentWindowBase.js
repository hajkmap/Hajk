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
  static propTypes = {};

  static defaultProps = {};

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

  scrollInDocument = (headerIdentifier) => {
    const { localObserver, model } = this.props;

    if (headerIdentifier) {
      localObserver.publish(
        "scroll-to-chapter",
        model.getHeaderRef(this.props.document, headerIdentifier)
      );
    } else {
      localObserver.publish(
        "scroll-to-top",
        model.getHeaderRef(this.props.document, headerIdentifier)
      );
    }
  };

  showHeaderInDocument = ({ documentName, headerIdentifier }) => {
    if (documentName) {
      if (documentName !== this.props.documentTitle) {
        this.props.showDocument(documentName).then(() => {
          this.scrollInDocument(headerIdentifier);
        });
      } else {
        this.scrollInDocument(headerIdentifier);
      }
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
      onMinimize,
      onMaximize,
    } = this.props;
    console.log(documentTitle, "documetnTitle");
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
          onMinimize: onMinimize,
          onMaximize: onMaximize,
          onWindowHide: onWindowHide,
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
              togglePrintWindow={togglePrintWindow}
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
