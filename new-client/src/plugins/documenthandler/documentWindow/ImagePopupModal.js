import React from "react";
import { withStyles } from "@material-ui/core/styles";
import IconButton from "@material-ui/core/IconButton";
import CardMedia from "@material-ui/core/CardMedia";
import CloseIcon from "@material-ui/icons/Close";
import Dialog from "@material-ui/core/Dialog";
import Modal from "@material-ui/core/Modal";
import Grid from "@material-ui/core/Grid";
import Container from "@material-ui/core/Container";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import ModalImage from "react-modal-image";
import { Lightbox } from "react-modal-image";
import Paper from "@material-ui/core/Paper";

const mapDiv = document.getElementById("map");
const blurCss = "filter : blur(7px)";

const styles = theme => ({
  closeButton: {
    position: "absolute",
    right: theme.spacing(0.5),
    top: theme.spacing(0.3)
  }
});

function PaperComponent(props) {
  return (
    <>
      <IconButton
        style={{
          backgroundColor: "white",
          position: "absolute",
          top: 20,
          right: 20,
          zIndex: 100
        }}
      >
        <CloseIcon></CloseIcon>
      </IconButton>
      <Paper {...props}></Paper>
    </>
  );
}

class ImagePopupModal extends React.PureComponent {
  imageHeight = 0;
  imageWidth = 0;

  removeMapBlur = () => {
    mapDiv.removeAttribute("style", blurCss);
  };

  addMapBlur = () => {
    mapDiv.setAttribute("style", blurCss);
  };

  componentWillUnmount = () => {
    this.removeMapBlur();
  };

  componentDidMount = () => {};

  render() {
    const { open, close, classes, image, imageType } = this.props;
    open ? this.addMapBlur() : this.removeMapBlur();
    if (image != null) {
      console.log(imageType, "imageType");
    }

    return (
      <>
        <Dialog
          maxWidth="lg"
          onBackdropClick={close}
          PaperComponent={PaperComponent}
          PaperProps={{
            component: "img",
            src: image,
            style: {
              maxHeight: "90%",
              maxWidth: "100%",
              overflow: "auto",
              backgroundColor: "transparent",
              boxShadow: "none",
              objectFit: "contain"
            }
          }}
          open={open}
        ></Dialog>
      </>
    );
  }
}

export default withStyles(styles)(ImagePopupModal);
