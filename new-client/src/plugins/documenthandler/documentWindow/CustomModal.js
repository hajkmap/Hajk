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
    outline: "none",
    minHeight: "80%",
    marginTop: "5%",
    marginBottom: "5%",
    overflow: "auto",
    [`${theme.breakpoints.down("sm")}`]: {
      height: "100%",
      marginTop: 0,
      marginBottom: 0
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
                <IconButton onClick={close} aria-label="delete">
                  <CloseIcon></CloseIcon>
                </IconButton>
              </Grid>
              <Grid container item>
                {this.props.children}
              </Grid>
            </Grid>
          </Container>
        </Modal>
      </>
    );
  }
}

export default withStyles(styles)(CustomModal);
