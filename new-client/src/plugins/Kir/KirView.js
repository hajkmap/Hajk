import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";

class KirView extends React.PureComponent {
  state = {};

  static propTypes = {
    model: PropTypes.object.isRequired,
    app: PropTypes.object.isRequired,
    localObserver: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
  };

  static defaultProps = {};

  constructor(props) {
    super(props);

    this.model = this.props.model;
    this.localObserver = this.props.localObserver;
    this.globalObserver = this.props.app.globalObserver;
  }

  render() {
    const { classes } = this.props;
    return (
      <>
        <div className={classes.root}>Kir</div>
      </>
    );
  }
}

const styles = (theme) => ({});

export default withStyles(styles)(withSnackbar(KirView));
