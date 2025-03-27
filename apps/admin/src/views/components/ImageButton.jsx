import React from "react";
import { Component } from "react";
import ReactModal from "react-modal";
import Button from "@material-ui/core/Button";
import AddIcon from "@material-ui/icons/Add";
import { withStyles } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";
import ImageIcon from "@material-ui/icons/Image";

const ColorButtonGreen = withStyles((theme) => ({
  root: {
    color: theme.palette.getContrastText(green[700]),
    backgroundColor: green[500],
    "&:hover": {
      backgroundColor: green[700],
    },
  },
}))(Button);

class StyleButton extends React.Component {
  constructor() {
    super();
    this.onToggle = (e) => {
      e.preventDefault();
      this.props.onToggle(this.props.style);
    };
  }

  render() {
    let className = "RichEditor-styleButton";
    if (this.props.active) {
      className += " RichEditor-activeButton";
    }

    return (
      <span className={className} onMouseDown={this.onToggle}>
        {this.props.label}
      </span>
    );
  }
}

class ImageButton extends Component {
  constructor(props) {
    super(props);
    this.state = {
      url: "https://loremflickr.com/cache/resized/65535_50301622157_65c29f21eb_z_640_360_nofilter.jpg",
      imageDialogVisible: false,
      editImageDialogVisible: false,
      imageList: this.props.imageList,
      imageWidth: undefined,
      imageHeight: undefined,
      imageCaption: "",
      imageSource: "",
      imagePopup: false,
    };
  }

  addImage() {
    this.setState({
      imageDialogVisible: false,
    });
    const imgData = {
      url: this.state.url,
      imageWidth: this.state.imageWidth,
      imageHeight: this.state.imageHeight,
      imageCaption: this.state.imageCaption,
      imageSource: this.state.imageSource,
      imagePopup: this.state.imagePopup,
    };
    this.props.addImage(imgData);
  }

  urlChanged(e) {
    this.setState({
      url: e.target.value,
    });
  }

  imageWidthChanged(e) {
    this.setState({
      imageWidth: e.target.value,
    });
  }

  imageHeightChanged(e) {
    this.setState({
      imageHeight: e.target.value,
    });
  }

  imageCaptionChanged(e) {
    this.setState({
      imageCaption: e.target.value,
    });
  }

  imageSourceChanged(e) {
    this.setState({
      imageSource: e.target.value,
    });
  }

  imagePopupToggle(e) {
    this.setState({
      imagePopup: !this.state.imagePopup,
    });
  }

  renderUrlInput() {
    var style = {
      color: "black",
      marginBottom: "5px",
    };
    if (this.state.imageDialogVisible) {
      return (
        <div style={style}>
          <input type="text" name="url" onChange={(e) => this.urlChanged(e)} />
          &nbsp;
          <ColorButtonGreen
            variant="contained"
            className="btn"
            onClick={() => {
              this.addImage();
            }}
            startIcon={<AddIcon />}
          >
            Lägg till
          </ColorButtonGreen>
        </div>
      );
    } else {
      return null;
    }
  }

  renderAddImageDialog() {
    const { imageList } = this.state;
    return (
      <ReactModal
        isOpen={this.state.imageDialogVisible}
        onRequestClose={(e) => this.closeImageDialog()}
        className="modal document-editor-modal"
        overlayClassName="Overlay"
        appElement={document.getElementById("root")}
      >
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Lägg till bild</h5>
            <button
              type="button"
              className="close"
              data-dismiss="modal"
              aria-label="Close"
              onClick={(e) => this.closeImageDialog()}
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div className="modal-body">
            <span>Välj bild i listan eller ange en bildlänk</span>
            <select onChange={(e) => this.urlChanged(e)}>
              {imageList
                ? imageList.map((image, i) => {
                    return (
                      //<option key={i} value={"/Upload/" + image}>
                      <option
                        key={i}
                        type="text"
                        name="url"
                        value={"../Upload/" + image}
                      >
                        {image}
                      </option>
                    );
                  })
                : null}
            </select>
            <input
              type="number"
              placeholder="Bildbredd"
              onChange={(e) => this.imageWidthChanged(e)}
            />
            <input
              type="number"
              placeholder="Bildhöjd"
              onChange={(e) => this.imageHeightChanged(e)}
            />
            <input
              type="text"
              placeholder="Bildtext (en beskrivning av bilden)"
              onChange={(e) => this.imageCaptionChanged(e)}
            />
            <input
              type="text"
              placeholder="Källa (Källa: xxxx, Fotograf: xxxx)"
              onChange={(e) => this.imageSourceChanged(e)}
            />
            <label className="form-check-label">Popup på/av</label>
            <input
              type="checkbox"
              className="form-check-input"
              checked={this.state.imagePopup}
              onChange={() => this.imagePopupToggle()}
            />
            <input
              type="text"
              name="url"
              placeholder="Välj bild i listan eller infoga webblänk"
              value={this.state.url}
              onChange={(e) => this.urlChanged(e)}
            />
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                this.addImage();
              }}
            >
              Infoga
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              data-dismiss="modal"
              onClick={(e) => this.closeImageDialog()}
            >
              Avbryt
            </button>
          </div>
        </div>
      </ReactModal>
    );
  }

  closeImageDialog() {
    this.setState({
      imageDialogVisible: false,
    });
  }

  render() {
    return (
      <div className="document-editor-controls">
        <StyleButton
          label={<ImageIcon />}
          onToggle={() => {
            this.setState({
              imageDialogVisible: !this.state.imageDialogVisible,
            });
          }}
        />
        {this.renderAddImageDialog()}
      </div>
    );
  }
}

export default ImageButton;
