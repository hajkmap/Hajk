import React, { useState, useEffect } from "react";
import Modal from "@material-ui/core/Modal";
import { makeStyles } from "@material-ui/core/styles";
import TextField from "@material-ui/core/TextField";
import Grid from "@material-ui/core/Grid";
import ArrowRightAltIcon from "@material-ui/icons/ArrowRightAlt";
import HeightIcon from "@material-ui/icons/Height";
import SubtitlesIcon from "@material-ui/icons/Subtitles";
import LinkIcon from "@material-ui/icons/Link";
import CheckIcon from "@material-ui/icons/Check";
import Radio from "@material-ui/core/Radio";
import RadioGroup from "@material-ui/core/RadioGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormControl from "@material-ui/core/FormControl";
import FormLabel from "@material-ui/core/FormLabel";
import Checkbox from "@material-ui/core/Checkbox";
import ImageIcon from "@material-ui/icons/Image";

const ImageComponent = (props) => {
  const classes = useStyles();

  const { readOnlyMode } = props.blockProps;
  const entity = props.contentState.getEntity(props.block.getEntityAt(0));
  const [entityKey, setEntityKey] = useState(entity);

  const { src } = entity.getData();
  const data = entity.getData();
  const dataSource = data["data-source"];
  const imageAlt = data.alt;
  const imageWidth = parseInt(data["data-image-width"]) || "";
  const imageHeight = parseInt(data["data-image-height"]) || "";
  const dataCaption = data["data-caption"];
  const dataPopup = data["data-image-popup"] === undefined ? false : true;
  const dataImagePosition = data["data-image-position"];

  const dataType = data["data-type"] || "image";
  const [open, setOpen] = useState(false);
  const [alt, setAlt] = useState(imageAlt); //useState(imageAlt === undefined ? "" : imageAlt);
  const [defaultWidth, setDefaultWidth] = useState();
  const [defaultHeight, setDefaultHeight] = useState();
  const [width, setWidth] = useState(imageWidth);
  const [height, setHeight] = useState(imageHeight);
  const [caption, setCaption] = useState(dataCaption);
  const [source, setSource] = useState(dataSource);
  const [popup, setPopup] = useState(dataPopup);
  const [imagePosition, setImagePosition] = useState(dataImagePosition);
  const [saveButton, showSaveButton] = useState(true);

  useEffect(() => {
    if (dataType === "image") {
      if (
        dataSource !== source ||
        imageAlt !== alt ||
        imageWidth !== width ||
        imageHeight !== height ||
        dataCaption !== caption ||
        dataPopup !== popup ||
        dataImagePosition !== imagePosition
      ) {
        showSaveButton(false);
      } else {
        showSaveButton(true);
      }
    } else if (dataType === "video") {
      if (
        dataSource !== source ||
        imageAlt !== alt ||
        imageWidth !== width ||
        imageHeight !== height ||
        dataCaption !== caption ||
        dataImagePosition !== imagePosition
      )
        showSaveButton(false);
      else showSaveButton(true);
    } else if (dataType === "audio") {
      if (
        dataSource !== source ||
        imageAlt !== alt ||
        dataCaption !== caption ||
        dataImagePosition !== imagePosition
      )
        showSaveButton(false);
      else showSaveButton(true);
    }
  }, [
    dataSource,
    source,
    imageAlt,
    alt,
    imageWidth,
    width,
    imageHeight,
    height,
    dataCaption,
    caption,
    dataPopup,
    popup,
    dataImagePosition,
    imagePosition,
  ]);

  const handleOpen = (e) => {
    e.preventDefault();
    setOpen(true);
    readOnlyMode();
  };

  const handleClose = (e) => {
    //e.preventDefault();
    setOpen(false);
    readOnlyMode();
  };

  const handleSubmit = () => {
    const { imageData } = props.blockProps;
    let data = {
      src: src,
      alt: alt === undefined ? setAlt("") : alt,
      "data-image-width": width ? width + "px" : null,
      "data-image-height": height ? height + "px" : null,
      "data-caption": caption,
      "data-source": source,
      "data-image-position": imagePosition,
    };
    if (popup) {
      data["data-image-popup"] = "";
    }
    if (dataType === "video") data["data-type"] = "video";
    else if (dataType === "audio") data["data-type"] = "audio";

    imageData(data);
  };

  const handleChange = (event) => {
    setImagePosition(event.target.value);
  };

  const handlePopupChange = (event) => {
    setPopup(event.target.checked);
  };

  const onImgLoad = ({ target: img }) => {
    const defaultWidth = img.offsetWidth;
    const defaultHeight = img.offsetHeight;

    setDefaultWidth(defaultWidth);
    setDefaultHeight(defaultHeight);
  };

  const onVideoLoad = ({ target: video }) => {
    const defaultWidth = video.offsetWidth;
    const defaultHeight = video.offsetHeight;

    setDefaultWidth(defaultWidth);
    setDefaultHeight(defaultHeight);
  };

  const onAudioLoad = ({ target: audio }) => {
    setDefaultWidth(300);
  };

  const calculateHeight = (width) => {
    if (width) {
      width = parseInt(width); //Convert string to number

      let aspectRatio = defaultHeight / defaultWidth;
      let height = width * aspectRatio;

      width = Math.trunc(width);
      height = Math.trunc(height);

      setWidth(width);
      setHeight(height);
    } else {
      setWidth("");
      setHeight("");
    }
  };

  const calculateWidth = (height) => {
    if (height) {
      height = parseInt(height); //Convert string to number

      let aspectRatio = defaultWidth / defaultHeight;
      let width = height * aspectRatio;

      height = Math.trunc(height);
      width = Math.trunc(width);

      setHeight(height);
      setWidth(width);
    } else {
      setHeight("");
      setWidth("");
    }
  };

  const popupDisabled = dataType != "image";

  const body = (
    <div className={classes.paper}>
      <h3 id="image-modal-title">Inställningar</h3>
      <FormControl className={classes.form} component="fieldset">
        <div className={classes.margin}>
          <Grid container spacing={1} alignItems="flex-end">
            <Grid item>
              <ArrowRightAltIcon />
            </Grid>
            <Grid item>
              <TextField
                id="image-width"
                value={width}
                onChange={(e) => calculateHeight(e.target.value)}
                label="Bredd"
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
                value={height}
                onChange={(e) => calculateWidth(e.target.value)}
                label="Höjd"
              />
            </Grid>
          </Grid>
          <Grid container spacing={1} alignItems="flex-end">
            <Grid item>
              <ImageIcon />
            </Grid>
            <Grid item>
              <TextField
                id="image-alt"
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                label="Alternativ text"
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
                defaultValue={caption}
                onChange={(e) => setCaption(e.target.value)}
                label="Bildtext"
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
                defaultValue={source}
                onChange={(e) => setSource(e.target.value)}
                label="Källa"
              />
            </Grid>
          </Grid>
          <Checkbox
            id="image-popup"
            checked={popup}
            onChange={handlePopupChange}
            disabled={popupDisabled}
            inputProps={{ "aria-label": "primary checkbox" }}
          />
          <label>Popup</label>
          <Grid container spacing={1} alignItems="flex-end">
            <Grid item>
              <button
                type="button"
                variant="contained"
                className="btn btn-primary"
                onClick={handleClose}
              >
                <CheckIcon /> Stäng
              </button>
            </Grid>
          </Grid>
        </div>
      </FormControl>
      <FormControl className={classes.form} component="fieldset">
        <FormLabel component="legend">Position</FormLabel>
        <RadioGroup
          aria-label="position"
          name="position"
          value="img-position"
          onChange={handleChange}
        >
          <FormControlLabel
            value="left"
            checked={imagePosition === "left"}
            control={<Radio />}
            label="Vänster"
          />
          <FormControlLabel
            value="center"
            checked={imagePosition === "center"}
            control={<Radio />}
            label="Center"
          />
          <FormControlLabel
            value="right"
            checked={imagePosition === "right"}
            control={<Radio />}
            label="Höger"
          />
          <FormControlLabel
            value="floatRight"
            checked={imagePosition === "floatRight"}
            control={<Radio />}
            label="Höger med text"
          />
          <FormControlLabel
            value="floatLeft"
            checked={imagePosition === "floatLeft"}
            control={<Radio />}
            label="Vänster med text"
          />
        </RadioGroup>
      </FormControl>
    </div>
  );

  const modal = (
    <Modal
      open={open}
      onClose={handleClose}
      id="edit-image-modal"
      aria-labelledby="image-modal-title"
      aria-describedby="image-modal-description"
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
    >
      {body}
    </Modal>
  );

  if (popup) {
    return (
      <div className={classes.imgContainer}>
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          data-image-width={width}
          data-image-height={height}
          data-caption={caption}
          data-source={source}
          data-image-popup=""
          data-image-position={imagePosition}
          onClick={handleOpen}
          onLoad={onImgLoad}
        />
        <button
          type="button"
          variant="contained"
          className="btn btn-success"
          onClick={handleSubmit}
          hidden={saveButton}
        >
          <CheckIcon /> Godkänn ändringar
        </button>
        {modal}
      </div>
    );
  } else {
    if (dataType === "image" || data.type === "image") {
      return (
        <div className={classes.imgContainer}>
          <img
            src={src}
            alt={alt}
            width={width}
            height={height}
            data-image-width={width}
            data-image-height={height}
            data-caption={caption}
            data-image-position={imagePosition}
            onClick={handleOpen}
            onLoad={onImgLoad}
          />
          <button
            type="button"
            variant="contained"
            className="btn btn-success"
            onClick={handleSubmit}
            hidden={saveButton}
          >
            <CheckIcon /> Godkänn ändringar
          </button>
          {modal}
        </div>
      );
    }
  }

  if (dataType === "video" || data.type === "video") {
    return (
      <div className={classes.imgContainer}>
        <video
          alt={alt}
          width={width}
          height={height}
          data-image-width={width}
          data-image-height={height}
          data-caption={caption}
          data-image-position={imagePosition}
          onClick={handleOpen}
          onLoadStart={onVideoLoad}
        >
          <source src={src} type="video/mp4"></source>
        </video>
        <button
          type="button"
          variant="contained"
          className="btn btn-success"
          onClick={handleSubmit}
          hidden={saveButton}
        >
          <CheckIcon /> Godkänn ändringar
        </button>
        {modal}
      </div>
    );
  }

  if (dataType === "audio" || data.type === "audio") {
    return (
      <div className={classes.imgContainer}>
        <audio
          alt={alt}
          width={width}
          height={height}
          data-image-width={width}
          data-image-height={height}
          data-caption={caption}
          data-image-position={imagePosition}
          onClick={handleOpen}
          onLoadStart={onAudioLoad}
          controls
        >
          <source src={src} type="audio/mpeg"></source>
        </audio>
        <button
          type="button"
          variant="contained"
          className="btn btn-success"
          onClick={handleSubmit}
          hidden={saveButton}
        >
          <CheckIcon /> Godkänn ändringar
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
  margin: {
    margin: theme.spacing(1),
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
    top: "20%",
    left: "30%",
    padding: "1rem",
    backgroundColor: theme.palette.background.paper,
    border: "2px solid #000",
    boxShadow: theme.shadows[5],
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
      textAlign: "center",
    },
    "& > .btn:hover": {
      backgroundColor: "black",
    },
  },
  form: {
    width: 300,
    float: "left",
  },
}));

export default ImageComponent;
