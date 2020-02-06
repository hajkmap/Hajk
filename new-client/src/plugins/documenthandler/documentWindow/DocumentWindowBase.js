import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import BaseWindowPlugin from "../../BaseWindowPlugin";
import DocumentViewer from "./DocumentViewer";
import MenuBookIcon from "@material-ui/icons/MenuBook";

const styles = theme => ({
  buttonWithBottomMargin: {
    marginBottom: theme.spacing(2)
  }
});

class DocumentWindowBase extends React.PureComponent {
  state = {
    counter: 0
  };

  static propTypes = {};

  static defaultProps = {};

  constructor(props) {
    super(props);
    this.model = this.props.model;
    this.localObserver = this.props.localObserver;
    this.globalObserver = this.props.app.globalObserver;
  }

  buttonClick = () => {
    this.localObserver.publish(
      "documentHandlerEvent",
      "This has been sent from  DocumentHandlerView using the Observer"
    );
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
          width: 400
        }}
      >
        <DocumentViewer
          model={this.dummyModel}
          app={this.props.app}
          localObserver={this.localObserver}
        />
      </BaseWindowPlugin>
    );
  }
}

export default withStyles(styles)(withSnackbar(DocumentWindowBase));
