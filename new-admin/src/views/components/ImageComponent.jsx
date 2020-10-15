import React, { useState } from "react";
import Modal from "@material-ui/core/Modal";
import { makeStyles } from "@material-ui/core/styles";

const ImageComponent = (props) => {
  const classes = useStyles();
  const [open, setOpen] = useState(false);
  const [width, setWidth] = useState("");

  const handleOpen = (e) => {
    e.preventDefault();
    setOpen(true);
  };

  const handleClose = (e) => {
    e.preventDefault();
    setOpen(false);
  };

  const body = (
    <div className={classes.paper}>
      <h2 id="image-modal-title">Redigerar bild</h2>
      <p id="image-modal-description">Inställningar för: {props.src}</p>
      <input type="text" value={props.src} placeholder="URL" />
      <input
        type="text"
        value={props["data-image-width"]}
        placeholder="data-image-width"
        onChange={(e) => setWidth(e.target.value)}
      />
      <input
        type="text"
        value={props["data-image-height"]}
        placeholder="data-image-height"
      />
      <input
        type="text"
        value={props["data-caption"]}
        placeholder="data-caption"
      />
      <input
        type="text"
        value={props["data-source"]}
        placeholder="data-source"
      />
      <input type="checkbox" id="data-popup" value={props["data-popup"]} />
      <label for="data-popup">Popup</label>
    </div>
  );

  const modal = (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="image-modal-title"
      aria-describedby="image-modal-description"
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
    >
      {body}
    </Modal>
  );

  if (props["data-popup"]) {
    return (
      <div className={classes.imgContainer}>
        <img
          src={props.src}
          width={props["data-image-width"]}
          height={props["data-image-height"]}
          alt={props["data-caption"]}
          data-image-width={props["data-image-width"]}
          data-image-height={props["data-image-height"]}
          data-caption={props["data-caption"]}
          data-source={props["data-source"]}
          data-popup
        />
        <button
          type="button"
          variant="contained"
          className="btn btn-primary"
          value="true"
          onClick={handleOpen}
        >
          Redigera bild
        </button>
        {modal}
      </div>
    );
  } else {
    return (
      <div className={classes.imgContainer}>
        <img
          src={props.src}
          width={props["data-image-width"]}
          height={props["data-image-height"]}
          alt={props["data-caption"]}
          data-image-width={props["data-image-width"]}
          data-image-height={props["data-image-height"]}
          data-caption={props["data-caption"]}
          data-source={props["data-source"]}
        />
        <button
          type="button"
          variant="contained"
          className="btn btn-primary"
          value="true"
          onClick={handleOpen}
        >
          Redigera bild
        </button>
        {modal}
      </div>
    );
  }
};

/* CSS styling */
const useStyles = makeStyles((theme) => ({
  root: {
    fontFamily: "'Georgia', serif",
    padding: 20,
    width: 1000,
  },
  buttons: {
    marginBottom: 10,
  },
  urlInputContainer: {
    marginBottom: 10,
  },
  urlInput: {
    fontFamily: "'Georgia', serif",
    marginRight: 10,
    padding: 3,
  },
  editor: {
    border: "1px solid #ccc",
    cursor: "text",
    minHeight: 80,
    padding: 10,
  },
  button: {
    marginTop: 10,
    textAlign: "center",
  },
  media: {
    whiteSpace: "initial",
  },
  paper: {
    position: "absolute",
    width: 400,
    border: "2px solid #000",
  },
  imgContainer: {
    position: "relative",
    width: "100%",
    maxWidth: 400,
    "& > img": {
      width: "100%",
      height: "auto",
    },
    "& > .btn": {
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      "-ms-transform": "translate(-50%, -50%)",
      backgroundColor: "#555",
      color: "white",
      fontSize: "16px",
      padding: "12px 24px",
      border: "none",
      cursor: "pointer",
      borderRadius: "5px",
      textAlign: "center",
    },
    "& > .btn:hover": {
      backgroundColor: "black",
    },
  },
}));

export default ImageComponent;
