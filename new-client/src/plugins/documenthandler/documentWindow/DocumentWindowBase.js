import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import BaseWindowPlugin from "../../BaseWindowPlugin";
import DocumentViewer from "./DocumentViewer";
import MenuBookIcon from "@material-ui/icons/MenuBook";

const styles = theme => ({});

class DocumentWindowBase extends React.PureComponent {
  state = {
    counter: 0
  };

  static propTypes = {};

  static defaultProps = {};

  constructor(props) {
    super(props);
    this.model = this.props.model;

    this.bindSubscriptions();
  }

  bindSubscriptions = () => {
    const { app, localObserver } = this.props;
    localObserver.subscribe("show-document-window", () => {
      app.globalObserver.publish("showDocumentviewer", {
        hideOtherPlugins: false
      });
    });
  };

  render() {
    return (
      <BaseWindowPlugin
        {...this.props}
        type="DocumentViewer"
        custom={{
          icon: <MenuBookIcon />,
          title: "Documents",
          description: "En kort beskrivning som visas i widgeten",
          height: 700,
          width: 400,
          draggingEnabled: false,
          resizingEnabled: false,
          allowMaximizedWindow: false
        }}
      >
        <DocumentViewer app={this.props.app} />
      </BaseWindowPlugin>
    );
  }
}

export default withStyles(styles)(withSnackbar(DocumentWindowBase));
