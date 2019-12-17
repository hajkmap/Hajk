import React from "react";
import { createPortal } from "react-dom";
import { withStyles } from "@material-ui/core/styles";
import propTypes from "prop-types";

import { Button, Paper, Tooltip } from "@material-ui/core";
import InfoIcon from "@material-ui/icons/Info";

import Dialog from "../components/Dialog.js";

const styles = theme => {
  return {
    paper: {
      marginBottom: theme.spacing(1)
    },
    button: {
      minWidth: "unset"
    }
  };
};

class Information extends React.PureComponent {
  static propTypes = {
    classes: propTypes.object.isRequired,
    options: propTypes.object.isRequired
  };

  constructor(props) {
    super(props);
    this.type = "Information"; // Special case - plugins that don't use BaseWindowPlugin must specify .type here
    this.options = props.options;
    this.title = this.options.title || "Om kartan";
    this.state = {
      dialogOpen: false
    };
  }

  componentDidMount() {
    let dialogOpen = this.options.visibleAtStart;

    if (this.options.visibleAtStart === true) {
      if (
        this.options.showInfoOnce === true &&
        parseInt(
          window.localStorage.getItem("pluginInformationMessageShown")
        ) === 1
      ) {
        dialogOpen = false;
      } else {
        if (this.options.showInfoOnce === true) {
          window.localStorage.setItem("pluginInformationMessageShown", 1);
        }
        dialogOpen = true;
      }
    } else {
      dialogOpen = false;
    }

    this.setState({
      dialogOpen
    });
  }

  onClose = () => {
    this.setState({
      dialogOpen: false
    });
  };

  handleOnClick = () => {
    this.setState({
      dialogOpen: true
    });
  };

  renderDialog() {
    const { headerText, text, buttonText } = this.props.options;

    return createPortal(
      <Dialog
        options={{ headerText, text, buttonText }}
        open={this.state.dialogOpen}
        onClose={this.onClose}
      />,
      document.getElementById("windows-container")
    );
  }

  render() {
    const { classes } = this.props;
    return (
      <>
        {this.renderDialog()}
        <Tooltip title={this.title}>
          <Paper className={classes.paper}>
            <Button
              aria-label={this.title}
              className={classes.button}
              onClick={this.handleOnClick}
            >
              <InfoIcon />
            </Button>
          </Paper>
        </Tooltip>
      </>
    );
  }
}

export default withStyles(styles)(Information);
