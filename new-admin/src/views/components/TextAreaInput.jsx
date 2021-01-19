import React, { useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";

import { EditorState, Modifier } from "draft-js";

const TextAreaInput = ({ editorState, updateEditorState, onCancelClick }) => {
  const classes = useStyles();
  const [backgroundColor, setBackgroundColor] = useState();
  const [dividerColor, setDividerColor] = useState();

  const selectionState = editorState.getSelection();
  const hasFocus = selectionState.get("hasFocus");

  const contentState = editorState.getCurrentContent();
  const contentBlock = contentState.getBlockForKey(
    selectionState.getAnchorKey()
  );
  const data = contentBlock.getData();
  const focusedBackgroundColor = data.get("backgroundColor") || "INGEN FÄRG";
  const focusedDividerColor = data.get("dividerColor") || "INGEN FÄRG";

  const onConfirmClick = () => {
    const contentState = editorState.getCurrentContent();
    const selectionState = editorState.getSelection();
    let data = new Map();
    data.set("backgroundColor", backgroundColor);
    data.set("dividerColor", dividerColor);
    data.set("textSection", "");
    updateEditorState(
      EditorState.push(
        editorState,
        Modifier.setBlockData(contentState, selectionState, data)
      )
    );
  };

  return (
    <Grid container>
      <Grid
        className={classes.textAreaInput}
        alignItems="center"
        container
        spacing={2}
        item
        xs={7}
      >
        <Grid direction="column" container item>
          <Grid item>
            <h1>Lägg till faktaruta</h1>
          </Grid>
          <Grid item>
            <p>
              Ställ markören där du vill skapa faktaruta eller editera faktaruta
            </p>
          </Grid>
        </Grid>
        <Grid spacing={2} item container>
          <Grid item>
            <Grid item>
              <label style={{ margin: 0 }}>data-background-color</label>
            </Grid>
            <Grid item>
              <input
                id="data-background-color"
                onChange={(e) => {
                  setBackgroundColor(e.target.value);
                }}
                type="text"
                value={backgroundColor || ""}
                placeholder="#ccc"
              />
            </Grid>
          </Grid>
          <Grid item>
            <Grid item>
              <label style={{ margin: 0 }}>data-divider-color</label>
            </Grid>
            <Grid item>
              <input
                id="data-divider-color"
                onChange={(e) => {
                  setDividerColor(e.target.value);
                }}
                type="text"
                value={dividerColor || ""}
                placeholder="#6A0DAD"
              />
            </Grid>
          </Grid>
        </Grid>

        <Grid item>
          <button
            className={classes.textAreaButton}
            onMouseDown={onConfirmClick}
            disabled={!hasFocus}
          >
            OK
          </button>

          <button onMouseDown={onCancelClick}>Avbryt</button>
        </Grid>
      </Grid>
      <Grid className={classes.textAreaInput} item xs={4}>
        <Grid direction="column" container item>
          <Grid item>
            {hasFocus && (
              <p>{`Markerad faktaruta har data-background-color
            ${focusedBackgroundColor}`}</p>
            )}
          </Grid>
          <Grid item>
            {hasFocus && (
              <p>{`Markerad faktaruta har data-divider-color
            ${focusedDividerColor}`}</p>
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
}));

export default TextAreaInput;
