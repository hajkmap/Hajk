import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import classNames from "classnames";

import Button from "@material-ui/core/Button";
import Snackbar from "@material-ui/core/Snackbar";
// import IconButton from "@material-ui/core/IconButton";
// import CloseIcon from "@material-ui/icons/Close";

const styles = theme => ({
  snackbar: {
    marginTop: "12px"
  },
  close: {
    padding: theme.spacing.unit / 2
  },
  error: {
    backgroundColor: "red"
  },
  warning: {
    backgroundColor: "orange"
  },
  info: {
    backgroundColor: "blue"
  },
  success: {
    backgroundColor: "green"
  }
});

class SimpleSnackbar extends React.Component {
  state = {
    open: false,
    opts: {
      message: "",
      type: "info",
      opts: undefined
    }
  };

  componentWillMount() {
    this.globalObserver = this.props.globalObserver;
    this.globalObserver.subscribe("showMessage", opts => {
      this.setState({
        open: true,
        opts
      });
    });
  }

  handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }

    this.setState({ open: false });
  };

  render() {
    const { classes } = this.props;

    return (
      <>
        <Snackbar
          className={classNames(
            classes.snackbar
            // classes[this.state.opts.type]
          )}
          anchorOrigin={{
            vertical: "top",
            horizontal: "center"
          }}
          open={this.state.open}
          autoHideDuration={6000}
          onClose={this.handleClose}
          ContentProps={{
            "aria-describedby": "message-id"
          }}
          message={<span id="message-id">{this.state.opts.message}</span>}
          action={[
            <Button
              key="close" // React needs this, as we send an array of objects, so a "key" property is required on each object
              color="secondary"
              size="small"
              onClick={this.handleClose}
            >
              OK, STÄNG
            </Button>
            // We could have an icon button instead:
            // <IconButton
            //   key="close2"
            //   aria-label="Close"
            //   color="inherit"
            //   className={classes.close}
            //   onClick={this.handleClose}
            // >
            //   <CloseIcon />
            // </IconButton>
          ]}
        />
      </>
    );
  }
}

SimpleSnackbar.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(SimpleSnackbar);
