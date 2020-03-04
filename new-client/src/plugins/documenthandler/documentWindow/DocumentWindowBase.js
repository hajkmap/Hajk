import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import BaseWindowPlugin from "../../BaseWindowPlugin";
import DocumentViewer from "./DocumentViewer";
import MenuBookIcon from "@material-ui/icons/MenuBook";
import Fab from "@material-ui/core/Fab";
import NavigationIcon from "@material-ui/icons/Navigation";

const styles = theme => ({});

const BaseWindow = props => {
  return (
    <BaseWindowPlugin
      {...props}
      type="DocumentViewer"
      custom={{
        icon: <MenuBookIcon />,
        title: "Documents",
        description: "En kort beskrivning som visas i widgeten",
        height: 1000,
        width: 400,
        draggingEnabled: false,
        resizingEnabled: false,
        allowMaximizedWindow: false
      }}
    >
      <DocumentViewer app={props.app} />
    </BaseWindowPlugin>
  );
};

class DocumentWindowBase extends React.PureComponent {
  state = {
    counter: 0
  };

  static propTypes = {};

  static defaultProps = {};

  constructor(props) {
    super(props);
    this.model = this.props.model;
    this.baseWindow = null;
    console.log(React.createRef(this), "ref");
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
    console.log(BaseWindow(this.props), "BaseWindow");
    return BaseWindow(this.props);
  }
}

export default withStyles(styles)(withSnackbar(DocumentWindowBase));
