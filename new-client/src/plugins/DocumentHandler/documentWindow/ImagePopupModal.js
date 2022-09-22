import React from "react";
import { styled } from "@mui/material/styles";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import Dialog from "@mui/material/Dialog";
import Paper from "@mui/material/Paper";

const mapDiv = document.getElementById("map");
const blurCss = "filter : blur(7px)";

const CloseButton = styled(IconButton)(({ theme }) => ({
  position: "absolute",
  backgroundColor: theme.palette.grey[50],

  "&:hover": {
    backgroundColor: theme.palette.grey[400],
  },

  zIndex: 100,
  right: theme.spacing(2),
  top: theme.spacing(2),
}));

const StyledPaper = styled(Paper)(() => ({
  maxHeight: "80%",
  maxWidth: "90%",
  overflow: "auto",
  backgroundColor: "transparent",
  boxShadow: "none",
  objectFit: "contain",
}));

function PaperComponent(props) {
  const { component, onClose, src, altValue } = props;
  return (
    <>
      <CloseButton size="small" onClick={onClose}>
        <CloseIcon />
      </CloseButton>
      <StyledPaper alt={altValue} component={component} src={src} />
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
      />
    );
  }
}

export default ImagePopupModal;
