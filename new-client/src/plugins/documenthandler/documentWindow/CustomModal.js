import React from "react";
import { withStyles } from "@material-ui/core/styles";
import Container from "@material-ui/core/Container";
import IconButton from "@material-ui/core/IconButton";
import clsx from "clsx";
import Grid from "@material-ui/core/Grid";
import CloseIcon from "@material-ui/icons/Close";
import Modal from "@material-ui/core/Modal";

const mapDiv = document.getElementById("map");
const blurCss = "filter : blur(7px)";

const styles = theme => ({
  container: {
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    display: "flex",
    position: "absolute",
    top: "5%",
    left: 0,
    right: 0,
    bottom: "5%",
    outline: "none",
    overflow: "auto",
    [`${theme.breakpoints.down("xs")}`]: {
      height: "100%",
      top: 0,
      bottom: 0
    }
  },
  fullScreen: {
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    outline: "none",
    width: "100%",
    height: "100%",
    overflow: "auto",
    [theme.breakpoints.down("xs")]: {
      height: "100%",
      marginTop: 0,
      marginBottom: 0
    }
  },
  closeButton: {
    position: "absolute",
    right: theme.spacing(2)
  },
  modalHeader: {
    paddingTop: theme.spacing(1),
    height: theme.spacing(7)
  },
  modalBottom: {
    paddingBottom: theme.spacing(1),
    height: theme.spacing(7)
  }
});

class CustomModal extends React.PureComponent {
  removeMapBlur = () => {
    mapDiv.removeAttribute("style", blurCss);
  };

  addMapBlur = () => {
    mapDiv.setAttribute("style", blurCss);
  };

  componentWillUnmount = () => {
    this.removeMapBlur();
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
            <Grid justify="flex-end" container>
              <Grid className={classes.modalHeader} item>
                <IconButton
                  className={classes.closeButton}
                  onClick={close}
                  aria-label="delete"
                >
                  <CloseIcon></CloseIcon>
                </IconButton>
              </Grid>
              <Grid alignContent="center" justify="flex-end" container>
                <Grid xs={12} item>
                  {this.props.children}
                </Grid>
              </Grid>
            </Grid>
          </Container>
        </Modal>
      </>
    );
  }
}

export default withStyles(styles)(CustomModal);
