import React, { useState, useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
import { red, green } from "@material-ui/core/colors";
import { withStyles } from "@material-ui/core/styles";
import { EditorState, Modifier } from "draft-js";
import { Typography, Button, Checkbox } from "@material-ui/core";

const ColorButtonRed = withStyles((theme) => ({
  root: {
    color: theme.palette.getContrastText(red[500]),
    backgroundColor: red[500],
    "&:hover": {
      backgroundColor: red[700],
    },
  },
}))(Button);

const ColorButtonGreen = withStyles((theme) => ({
  root: {
    color: theme.palette.getContrastText(green[700]),
    backgroundColor: green[500],
    "&:hover": {
      backgroundColor: green[700],
    },
  },
}))(Button);

const colorBox = (color) => {
  return (
    <p
      style={{
        width: "30px",
        height: "20px",
        backgroundColor: color,
        display: color ? "inherit" : "none",
      }}
    ></p>
  );
};

const TextAreaInput = ({ editorState, updateEditorState, onCancelClick }) => {
  const classes = useStyles();

  const selectionState = editorState.getSelection();
  const hasFocus = selectionState.get("hasFocus");
  const contentState = editorState.getCurrentContent();
  const contentBlock = contentState.getBlockForKey(
    selectionState.getAnchorKey()
  );
  const data = contentBlock.getData();

  const currentBackgroundColor = data.get("backgroundColor");
  const [backgroundColor, setBackgroundColor] = useState();

  const currentDividerColor = data.get("dividerColor");
  const [dividerColor, setDividerColor] = useState();

  const currentIsAccordion = data.get("isAccordion") === "true";
  const [isAccordion, setIsAccordion] = useState(currentIsAccordion);

  const currentAccordionTitle = data.get("accordionTitle");
  const [accordionTitle, setAccordionTitle] = useState();

  useEffect(() => {
    setIsAccordion(currentIsAccordion);
    setAccordionTitle(currentAccordionTitle);
    setBackgroundColor(currentBackgroundColor);
    setDividerColor(currentDividerColor);
  }, [contentBlock]);

  const onConfirmClick = () => {
    const contentState = editorState.getCurrentContent();
    const selectionState = editorState.getSelection();
    let data = new Map();
    data.set("backgroundColor", backgroundColor);
    data.set("dividerColor", dividerColor);
    data.set("textSection", "");
    data.set("isAccordion", isAccordion);
    isAccordion && data.set("accordionTitle", accordionTitle);
    updateEditorState(
      EditorState.push(
        editorState,
        Modifier.setBlockData(contentState, selectionState, data)
      )
    );
  };

  return (
    <Grid className={classes.textAreaInput} container>
      <Grid alignItems="center" container spacing={2} item xs={7}>
        <Grid direction="column" container item>
          <Grid item>
            <Typography variant="h5">Lägg till faktaruta</Typography>
          </Grid>
          <Grid item>
            <Typography variant="body1">
              Ställ markören där du vill skapa faktaruta eller editera faktaruta
            </Typography>
          </Grid>
          <Grid item>
            <Typography variant="body2" className={classes.warningText}>
              <strong>
                Vid användning av dessa inställningar riskeras dark/light-mode
                sättas ur spel
              </strong>
            </Typography>
          </Grid>
          <Grid item container>
            <Grid direction="column" container item>
              <Grid item>
                <label style={{ margin: 0 }}>
                  Bakgrundsfärg (data-background-color)
                </label>
              </Grid>
              <Grid item>
                <input
                  id="data-background-color"
                  onChange={(e) => {
                    setBackgroundColor(e.target.value);
                  }}
                  type="text"
                  value={backgroundColor || ""}
                  placeholder="Ex. #ccc"
                />
              </Grid>
              <Grid item>
                <label style={{ margin: 0 }}>
                  Kantfärg (data-divider-color)
                </label>
              </Grid>
              <Grid item>
                <input
                  id="data-divider-color"
                  onChange={(e) => {
                    setDividerColor(e.target.value);
                  }}
                  type="text"
                  value={dividerColor || ""}
                  placeholder="Ex. #6A0DAD"
                />
              </Grid>
              <Grid item>
                <label style={{ margin: 0 }}>
                  Hopfällbar faktaruta (data-accordion)
                </label>
              </Grid>
              <Grid container direction="row" item>
                <Grid item>
                  <Checkbox
                    style={{ padding: "0 10px 0px 10px" }}
                    id="data-accordion"
                    onChange={(e) => {
                      setIsAccordion(!isAccordion);
                    }}
                    checked={isAccordion}
                  />
                </Grid>
                <Grid item>
                  <input
                    id="data-accordion-title"
                    onChange={(e) => {
                      setAccordionTitle(e.target.value);
                    }}
                    type="text"
                    value={accordionTitle || ""}
                    placeholder={"Titel..."}
                    disabled={!isAccordion}
                  />
                </Grid>
              </Grid>
            </Grid>
            <Grid container direction="column" item></Grid>
          </Grid>
        </Grid>

        <Grid item>
          <ColorButtonGreen
            variant="contained"
            className={classes.textAreaButton}
            onMouseDown={onConfirmClick}
            disabled={!hasFocus}
          >
            OK
          </ColorButtonGreen>

          <ColorButtonRed variant="contained" onMouseDown={onCancelClick}>
            Avbryt
          </ColorButtonRed>
        </Grid>
      </Grid>
      <Grid className={classes.textAreaInput} item xs={5}>
        <Grid direction="column" container item>
          <Grid item>
            {hasFocus && (
              <div>
                <p style={{ margin: currentBackgroundColor ? "0" : "" }}>
                  {`Markerad faktaruta har data-background-color
            ${currentBackgroundColor || "INGEN FÄRG"}`}
                </p>
                {colorBox(currentBackgroundColor)}
              </div>
            )}
          </Grid>
          <Grid item>
            {hasFocus && (
              <div>
                <p
                  style={{ margin: currentDividerColor ? "0" : "" }}
                >{`Markerad faktaruta har data-divider-color
            ${currentDividerColor || "INGEN FÄRG"}`}</p>
                {colorBox(currentDividerColor)}
              </div>
            )}
          </Grid>
          <Grid item>
            {hasFocus && (
              <p>{`Markerad faktaruta ${
                currentIsAccordion ? "ÄR" : "ÄR INTE"
              } data-accordion
            `}</p>
            )}
          </Grid>
          <Grid item>
            {hasFocus && (
              <p>{`Markerad faktaruta har data-accordion-title ${
                currentAccordionTitle || "INGEN TITEL"
              }
            `}</p>
            )}
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

/* CSS styling */
const useStyles = makeStyles((theme) => ({
  textAreaInput: {
    margin: theme.spacing(1),
  },
  textAreaButton: {
    marginRight: theme.spacing(1),
  },
  warningText: {
    color: theme.palette.error.main,
  },
}));

export default TextAreaInput;
