import React from "react";
import { withStyles } from "@material-ui/core/styles";
import BaseWindowPlugin from "../../BaseWindowPlugin";
import DocumentViewer from "./DocumentViewer";
import MenuBookIcon from "@material-ui/icons/MenuBook";
import Grid from "@material-ui/core/Grid";
import CircularProgress from "@material-ui/core/CircularProgress";

const styles = theme => ({});

class DocumentWindowBase extends React.PureComponent {
  state = {
    counter: 0,
    document: null,
    documentWindowMaximized: true
  };

  static propTypes = {};

  static defaultProps = {};

  constructor(props) {
    super(props);
    this.model = this.props.model;
    this.bindSubscriptions();
  }

  setActiveDocument = title => {
    return new Promise((resolve, reject) => {
      this.model.fetchJsonDocument(title, document => {
        this.setState(
          {
            documentTitle: title,
            document: document,
            documentColor: this.findReferringMenuItem(title).color
          },
          () => {
            resolve();
          }
        );
      });
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
      var i;
      var result = null;
      for (i = 0; result == null && i < menuItem.menu.length; i++) {
        result = this.findMenuItem(menuItem.menu[i], documentNameToFind);
      }
      return result;
    }
    return null;
  }

  findReferringMenuItem = documentNameToFind => {
    const { options } = this.props;
    return options.menuConfig.menu.find(rootItemToSearch => {
      return this.findMenuItem(rootItemToSearch, documentNameToFind) != null;
    });
  };

  showDocumentWindow = ({ documentName, headerIdentifier }) => {
    const { app, localObserver } = this.props;
    app.globalObserver.publish("documentviewer.showWindow", {
      hideOtherPlugins: false
    });
    this.setActiveDocument(documentName).then(() => {
      if (headerIdentifier) {
        localObserver.publish(
          "scroll-to",
          this.model.getHeaderRef(this.state.document, headerIdentifier)
        );
      }
    });
  };

  bindSubscriptions = () => {
    const { localObserver } = this.props;
    localObserver.subscribe("show-document-window", this.showDocumentWindow);
  };

  render() {
    const {
      documentWindowMaximized,
      document,
      documentTitle,
      documentColor
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
          height: options.height || "90vh",
          width: options.width || 600,
          scrollable: false,
          onMinimize: this.onMinimize,
          onMaximize: this.onMaximize,
          onResize: this.onResize,
          draggingEnabled: false,
          resizingEnabled: false,
          allowMaximizedWindow: false
        }}
      >
        {document != null ? (
          <DocumentViewer
            documentColor={documentColor || "#ffffff"}
            documentWindowMaximized={documentWindowMaximized}
            activeDocument={document}
            {...this.props}
          />
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
