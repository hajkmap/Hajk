import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import BaseWindowPlugin from "../../BaseWindowPlugin";
import DocumentViewer from "./DocumentViewer";
import MenuBookIcon from "@material-ui/icons/MenuBook";

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
        this.setState({ document: document }, () => {
          resolve();
        });
      });
    });
  };

  onMinimize = () => {
    this.setState({ documentWindowMaximized: false });
  };

  onMaximize = () => {
    this.setState({ documentWindowMaximized: true });
  };

  getHeaderRef = () => {
    //TODO - NEED TO GET ChapterObject from GUID
  };

  showDocumentWindow = ({ documentName, headerToScrollTo }) => {
    const { app, localObserver } = this.props;
    app.globalObserver.publish("documentviewer.showWindow", {
      hideOtherPlugins: false
    });
    this.setActiveDocument(documentName).then(() => {
      localObserver.publish("scroll-to", this.getHeaderRef(headerToScrollTo)); //TODO
    });
  };

  bindSubscriptions = () => {
    const { localObserver } = this.props;
    localObserver.subscribe("show-document-window", this.showDocumentWindow);
  };

  render() {
    const { documentWindowMaximized, document } = this.state;
    const { options } = this.props;

    return (
      <BaseWindowPlugin
        {...this.props}
        type="DocumentViewer"
        custom={{
          icon: <MenuBookIcon />,
          title: options.windowTitle || "Documents",
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
        <DocumentViewer
          documentWindowMaximized={documentWindowMaximized}
          activeDocument={document}
          {...this.props}
        />
      </BaseWindowPlugin>
    );
  }
}

export default withStyles(styles)(withSnackbar(DocumentWindowBase));
