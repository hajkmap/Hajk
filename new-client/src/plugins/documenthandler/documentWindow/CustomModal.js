import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import Container from "@material-ui/core/Container";
import clsx from "clsx";
import CloseIcon from "@material-ui/icons/Close";

import Modal from "@material-ui/core/Modal";

const mapDiv = document.getElementById("map");
const blurCss = "filter : blur(7px)";

const styles = theme => ({
  container: {
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    outline: "none",
    minHeight: "80%",
    marginTop: "5%",
    marginBottom: "5%",
    [theme.breakpoints.down("xs")]: {
      height: "100%",
      overflow: "scroll",
      marginTop: 0,
      marginBottom: 0
    }
  },
  fullScreen: {
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    outline: "none",
    width: "100%",
    height: "100%",
    [theme.breakpoints.down("xs")]: {
      height: "100%",
      overflow: "scroll",
      marginTop: 0,
      marginBottom: 0
    }
  }
});

class CustomModal extends React.PureComponent {
  removeMapBlur = () => {
    mapDiv.removeAttribute("style", blurCss);
  };

  addMapBlur = () => {
    mapDiv.setAttribute("style", blurCss);
  };

  render() {
    const { open, close, classes, fullScreen } = this.props;
    open ? this.addMapBlur() : this.removeMapBlur();

    return (
      <>
        <Modal onBackdropClick={close} open={open}>
          <Container
            maxWidth={fullScreen ? fullScreen : "lg"}
            className={clsx(
              this.props.fullScreen ? classes.fullScreen : classes.container
            )}
          >
            {this.props.children}
          </Container>
        </Modal>
      </>
    );
  }
}

export default withStyles(styles)(withSnackbar(CustomModal));
