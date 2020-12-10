import React, { useState } from "react";
import Modal from "@material-ui/core/Modal";
import { makeStyles } from "@material-ui/core/styles";
import TextField from "@material-ui/core/TextField";
import Grid from "@material-ui/core/Grid";
import ArrowRightAltIcon from "@material-ui/icons/ArrowRightAlt";
import HeightIcon from "@material-ui/icons/Height";
import SubtitlesIcon from "@material-ui/icons/Subtitles";
import LinkIcon from "@material-ui/icons/Link";
import CheckIcon from "@material-ui/icons/Check";

const ImageComponent = props => {
  const classes = useStyles();

  const { readOnlyMode } = props.blockProps;
  const entity = props.contentState.getEntity(props.block.getEntityAt(0));

  const { src } = entity.getData();
  const data = entity.getData();
  const imageWidth = data["data-image-width"];
  const imageHeight = data["data-image-height"];
  const dataCaption = data["data-caption"];
  const dataSource = data["data-source"];
  const dataPopup = data["data-popup"];

  const [open, setOpen] = useState(false);
  const [width, setWidth] = useState(imageWidth);
  const [height, setHeight] = useState(imageHeight);
  const [caption, setCaption] = useState(dataCaption);
  const [source, setSource] = useState(dataSource);
  const [popup, setPopup] = useState(dataPopup);

  const handleOpen = e => {
    e.preventDefault();
    setOpen(true);
    readOnlyMode();
  };

  const handleClose = e => {
    e.preventDefault();
    setOpen(false);
    readOnlyMode();
  };

  const handleSubmit = () => {
    const { imageData } = props.blockProps;
    const data = {
      src: src,
      "data-image-width": width,
      "data-image-height": height,
      "data-caption": caption,
      "data-source": source,
      "data-popup": popup
    };

    imageData(data);
  };

  const body = (
    <div className={classes.paper}>
      <form className={classes.form}>
        <h2 id="image-modal-title">Redigera bild</h2>
        <div className={classes.margin}>
          <Grid container spacing={1} alignItems="flex-end">
            <Grid item>
              <ArrowRightAltIcon />
            </Grid>
            <Grid item>
              <TextField
                id="image-width"
                defaultValue={width}
                onChange={e => setWidth(e.target.value)}
                label="data-image-width"
              />
            </Grid>
          </Grid>
          <Grid container spacing={1} alignItems="flex-end">
            <Grid item>
              <HeightIcon />
            </Grid>
            <Grid item>
              <TextField
                id="image-height"
                defaultValue={height}
                onChange={e => setHeight(e.target.value)}
                label="data-image-height"
              />
            </Grid>
          </Grid>
          <Grid container spacing={1} alignItems="flex-end">
            <Grid item>
              <SubtitlesIcon />
            </Grid>
            <Grid item>
              <TextField
                id="image-caption"
                defaultValue={dataCaption}
                onChange={e => setCaption(e.target.value)}
                label="data-caption"
              />
            </Grid>
          </Grid>
          <Grid container spacing={1} alignItems="flex-end">
            <Grid item>
              <LinkIcon />
            </Grid>
            <Grid item>
              <TextField
                id="image-source"
                defaultValue={dataSource}
                onChange={e => setSource(e.target.value)}
                label="data-source"
              />
            </Grid>
          </Grid>
        </div>

        <input
          type="checkbox"
          id="image-popup"
          value={dataPopup}
          onChange={e => setPopup(e.target.checked)}
        />
        <label>Popup</label>
      </form>
    </div>
  );

  const modal = (
    <Modal
      open={open}
      onClose={handleClose}
      id="edit-image-modal"
      aria-labelledby="image-modal-title"
      aria-describedby="image-modal-description"
      onClick={event => event.stopPropagation()}
      onMouseDown={event => event.stopPropagation()}
    >
      {body}
    </Modal>
  );

  if (dataPopup) {
    return (
      <div className={classes.imgContainer}>
        <img
          src={src}
          width={width}
          height={height}
          alt={dataCaption}
          data-image-width={width}
          data-image-height={height}
          data-caption={dataCaption}
          data-source={dataSource}
          data-popup
          onClick={handleOpen}
        />
        <button
          type="button"
          variant="contained"
          className="btn btn-success"
          onClick={handleSubmit}
        >
          <CheckIcon /> Godkänn ändringar
        </button>
        {modal}
      </div>
    );
  } else {
    return (
      <div className={classes.imgContainer}>
        <img
          src={src}
          width={width}
          height={height}
          alt={dataCaption}
          data-image-width={width}
          data-image-height={height}
          data-caption={dataCaption}
          data-source={dataSource}
          onClick={handleOpen}
        />
        <button
          type="button"
          variant="contained"
          className="btn btn-success"
          onClick={handleSubmit}
        >
          <CheckIcon /> Godkänn ändringar
        </button>
        {modal}
      </div>
    );
  }
};

/* CSS styling */
const useStyles = makeStyles(theme => ({
  root: {
    fontFamily: "'Georgia', serif",
    padding: 20,
    width: 1000
  },
  buttons: {
    marginBottom: 10
  },
  margin: {
    margin: theme.spacing(1)
  },
  urlInputContainer: {
    marginBottom: 10
  },
  urlInput: {
    fontFamily: "'Georgia', serif",
    marginRight: 10,
    padding: 3
  },
  editor: {
    border: "1px solid #ccc",
    cursor: "text",
    minHeight: 80,
    padding: 10
  },
  button: {
    marginTop: 10,
    textAlign: "center"
  },
  media: {
    whiteSpace: "initial"
  },
  paper: {
    position: "absolute",
    width: 400,
    top: "20%",
    left: "30%",
    padding: "1rem",
    backgroundColor: theme.palette.background.paper,
    border: "2px solid #000",
    boxShadow: theme.shadows[5]
  },
  imgContainer: {
    position: "relative",
    width: "100%",
    maxWidth: 400,
    "& > .btn": {
      position: "absolute",
      top: "30px",
      left: "30%",
      transform: "translate(-50%, -50%)",
      "-ms-transform": "translate(-50%, -50%)",
      color: "white",
      fontSize: "16px",
      border: "none",
      cursor: "pointer",
      borderRadius: "5px",
      textAlign: "center"
    },
    "& > .btn:hover": {
      backgroundColor: "black"
    }
  }
}));

export default ImageComponent;
