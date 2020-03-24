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
    this.model.fetchJsonDocument(title, document => {
      this.setState({ document: document });
    });
  };

  onMinimize = () => {
    this.setState({ documentWindowMaximized: false });
  };

  onMaximize = () => {
    this.setState({ documentWindowMaximized: true });
  };

  bindSubscriptions = () => {
    const { app, localObserver } = this.props;
    localObserver.subscribe("show-document-window", item => {
      app.globalObserver.publish("showDocumentviewer", {
        hideOtherPlugins: false
      });
      this.setActiveDocument(item.document);
    });
  };

  render() {
    const { documentWindowMaximized, document } = this.state;
    return (
      <BaseWindowPlugin
        {...this.props}
        type="DocumentViewer"
        custom={{
          icon: <MenuBookIcon />,
          title: "Documents",
          description: "En kort beskrivning som visas i widgeten",
          height: "90vh",
          width: 600,
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
