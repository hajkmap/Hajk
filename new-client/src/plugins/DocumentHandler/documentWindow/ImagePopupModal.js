import React from "react";
import withStyles from "@mui/styles/withStyles";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import Dialog from "@mui/material/Dialog";
import Paper from "@mui/material/Paper";

const mapDiv = document.getElementById("map");
const blurCss = "filter : blur(7px)";

const styles = (theme) => ({
  closeButton: {
    position: "absolute",
    backgroundColor: theme.palette.grey[50],
    "&:hover": {
      backgroundColor: theme.palette.grey[400],
    },
    zIndex: 100,
    right: theme.spacing(2),
    top: theme.spacing(2),
  },
  paper: {
    maxHeight: "80%",
    maxWidth: "90%",
    overflow: "auto",
    backgroundColor: "transparent",
    boxShadow: "none",
    objectFit: "contain",
  },
});

const PaperComponent = withStyles(styles)(PaperComponentRaw);

function PaperComponentRaw(props) {
  const { classes, component, onClose, src, altValue } = props;
  return (
    <>
      <IconButton
        size="small"
        onClick={onClose}
        className={classes.closeButton}
      >
        <CloseIcon></CloseIcon>
      </IconButton>
      <Paper
        alt={altValue}
        component={component}
        src={src}
        className={classes.paper}
      ></Paper>
    </>
  );
}

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

  componentDidMount = () => {};

  render() {
    const { open, close, image } = this.props;
    open ? this.addMapBlur() : this.removeMapBlur();

    return (
      <>
        <Dialog
          maxWidth="lg"
          onBackdropClick={close}
          PaperComponent={PaperComponent}
          PaperProps={{
            component: "img",
            onClose: close,
            src: image?.url,
            altValue: image?.altValue,
          }}
          open={open}
        ></Dialog>
      </>
    );
  }
}

export default withStyles(styles)(ImagePopupModal);
