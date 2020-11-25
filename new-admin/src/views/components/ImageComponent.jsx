import React, { useState } from "react";
import Modal from "@material-ui/core/Modal";
import { makeStyles } from "@material-ui/core/styles";
import TextField from "@material-ui/core/TextField";
import Grid from "@material-ui/core/Grid";
import LanguageIcon from "@material-ui/icons/Language";
import ArrowRightAltIcon from "@material-ui/icons/ArrowRightAlt";
import HeightIcon from "@material-ui/icons/Height";
import SubtitlesIcon from "@material-ui/icons/Subtitles";
import LinkIcon from "@material-ui/icons/Link";

export const ReadOnly = () => {
  return false;
};

const ImageComponent = props => {
  const classes = useStyles();

  const [open, setOpen] = useState(false);
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");

  const handleOpen = e => {
    e.preventDefault();
    setOpen(true);
  };

  const handleClose = e => {
    e.preventDefault();
    setOpen(false);
  };

  const body = (
    <div className={classes.paper}>
      <form className={classes.form}>
        <h2 id="image-modal-title">Redigera bild</h2>
        <div className={classes.margin}>
          <Grid container spacing={1} alignItems="flex-end">
            <Grid item>
              <LanguageIcon />
            </Grid>
            <Grid item>
              <TextField id="image-url" value={props.src} label="URL" />
            </Grid>
          </Grid>
          <Grid container spacing={1} alignItems="flex-end">
            <Grid item>
              <ArrowRightAltIcon />
            </Grid>
            <Grid item>
              <TextField
                id="image-width"
                value={props.width}
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
                value={props.height}
                onChange={e => setWidth(e.target.value)}
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
                value={props["data-caption"]}
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
                value={props["data-source"]}
                label="data-source"
              />
            </Grid>
          </Grid>
        </div>

        <input type="checkbox" id="image-popup" value={props["data-popup"]} />
        <label>Popup</label>
      </form>
    </div>
  );

  const modal = (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="image-modal-title"
      aria-describedby="image-modal-description"
      onClick={event => event.stopPropagation()}
      onMouseDown={event => event.stopPropagation()}
    >
      {body}
    </Modal>
  );

  if (props["data-popup"]) {
    return (
      <div className={classes.imgContainer}>
        <img
          src={props.src}
          width={props.width}
          height={props.height}
          alt={props["data-caption"]}
          data-image-width={props.width}
          data-image-height={props.height}
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
          width={props.width}
          height={props.height}
          alt={props["data-caption"]}
          data-image-width={props.width}
          data-image-height={props.height}
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
    boxShadow: theme.shadows[5],
    padding: theme.spacing(2, 4, 3)
  },
  imgContainer: {
    position: "relative",
    width: "100%",
    maxWidth: 400,
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
      textAlign: "center"
    },
    "& > .btn:hover": {
      backgroundColor: "black"
    }
  },
  form: {
    /*padding: "1rem",
    marginTop: "2rem",
    marginRight: "auto",
    marginLeft: "auto",
    maxWidth: "remy(380px)",*/
  }
}));

export default ImageComponent;
