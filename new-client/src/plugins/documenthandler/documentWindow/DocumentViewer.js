import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";

const styles = theme => ({
  buttonWithBottomMargin: {
    marginBottom: theme.spacing(2)
  }
});

class DocumentViewer extends React.PureComponent {
  state = {};

  static propTypes = {};

  static defaultProps = {};

  constructor(props) {
    super(props);
    this.model = this.props.model;
    this.localObserver = this.props.localObserver;
    this.globalObserver = this.props.app.globalObserver;
  }

  render() {
    return <></>;
  }
}

export default withStyles(styles)(withSnackbar(DocumentViewer));
