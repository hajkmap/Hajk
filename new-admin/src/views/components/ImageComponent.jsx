import React, { useState } from "react";
import Modal from "@material-ui/core/Modal";

const ImageComponent = (props) => {
  const [open, setOpen] = useState(false);

  const handleOpen = (e) => {
    e.preventDefault();
    setOpen(true);
  };

  const handleClose = (e) => {
    e.preventDefault();
    setOpen(false);
  };

  const body = (
    <div className={styles.paper}>
      <h2 id="image-modal-title">Redigerar bild</h2>
      <p id="image-modal-description">Inställningar för: {props.src}</p>
      <input type="text" value={props.src} />
      <input type="number" value={props.width} />
      <input type="number" value={props.height} />
      <input type="text" value={props["data-caption"]} />
      <input type="text" value={props["data-source"]} />
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
      <div>
        <img
          src={props.src}
          width={props.width}
          height={props.height}
          alt={props["data-caption"]}
          data-caption={props["data-caption"]}
          data-source={props["data-source"]}
          data-popup
        />
        <button type="button" value="true" onClick={handleOpen}>
          Redigera bild
        </button>
        {modal}
      </div>
    );
  } else {
    return (
      <div>
        <img
          src={props.src}
          width={props.width}
          height={props.height}
          alt={props["data-caption"]}
          data-caption={props["data-caption"]}
          data-source={props["data-source"]}
        />
        <button type="button" value="true" onClick={handleOpen}>
          Redigera bild
        </button>
        {modal}
      </div>
    );
  }
};

/* CSS styling */
const styles = {
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
    //backgroundColor: theme.palette.background.paper,
    border: "2px solid #000",
    //boxShadow: theme.shadows[5],
    //padding: theme.spacing(2, 4, 3),
  },
};

export default ImageComponent;
