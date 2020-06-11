import React from "react";
import { withStyles } from "@material-ui/core/styles";
import IconButton from "@material-ui/core/IconButton";
import CardMedia from "@material-ui/core/CardMedia";
import CloseIcon from "@material-ui/icons/Close";
import Modal from "@material-ui/core/Modal";

const mapDiv = document.getElementById("map");
const blurCss = "filter : blur(7px)";

const styles = theme => ({
  imageContainer: {
    position: "absolute",
    [theme.breakpoints.up("sm")]: {
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%)"
    },

    [theme.breakpoints.down("xs")]: {
      left: theme.spacing(2),
      right: theme.spacing(2),
      top: "50%",
      transform: "translate(0%, -50%)"
    }
  },
  closeButton: {
    position: "absolute",
    right: theme.spacing(0.5),
    top: theme.spacing(0.3)
  }
});

class ImagePopupModal extends React.PureComponent {
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
    const { open, close, classes, image } = this.props;
    open ? this.addMapBlur() : this.removeMapBlur();
    return (
      <Modal
        aria-label="Modal showing picture"
        onBackdropClick={close}
        open={open}
      >
        <div className={classes.imageContainer}>
          <IconButton
            onClick={close}
            className={classes.closeButton}
            aria-label="close menu"
          >
            <CloseIcon></CloseIcon>
          </IconButton>
          <CardMedia
            aria-label="popup image"
            component="img"
            image={image}
          ></CardMedia>
        </div>
      </Modal>
    );
  }
}

export default withStyles(styles)(ImagePopupModal);
