import React from "react";
import { styled } from "@mui/material";
import { Button, IconButton, Zoom } from "@mui/material";
import { Grid, Paper, TextField, Tooltip, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

import { useSnackbar } from "notistack";

import { MAX_SKETCHES } from "../constants";
import Information from "../components/Information";
import ConfirmationDialog from "../../../components/ConfirmationDialog";

const StyledPaper = styled(Paper)(({ theme }) => ({
  width: "100%",
  padding: theme.spacing(1),
  marginBottom: theme.spacing(1),
  borderRight: `${theme.spacing(0.5)} solid ${theme.palette.info.main}`,
  borderLeft: `${theme.spacing(0.5)} solid ${theme.palette.info.main}`,
}));

// A view that is rendered if the user has selected not to accept functional
// cookies. (Functional cookies has to be accepted, otherwise this part of the plugin
// has no meaning).
const NotSupportedView = ({ globalObserver }) => {
  // Handles clicks on the "change-cookie-settings-button". Simply emits an event
  // on the global-observer, stating that the cookie-banner should be shown again.
  const handleChangeCookieSettingsClick = () => {
    globalObserver.publish("core.showCookieBanner");
  };
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Information
          text="Det ser ut som att du har valt att inte tillåta funktionella kakor. På grund av
        detta så kan du inte spara dina rit-objekt. Klicka nedan för att ändra inställningarna."
        />
      </Grid>
      <Grid item xs={12}>
        <Button
          fullWidth
          variant="contained"
          onClick={handleChangeCookieSettingsClick}
        >
          Cookie-inställningar
        </Button>
      </Grid>
    </Grid>
  );
};

// A simple component allowing the user to select a name and save the current
// sketch to LS under that name.
const SketchSaver = (props) => {
  // We're gonna want to prompt the user with a snackbar when a sketch is saved.
  const { enqueueSnackbar } = useSnackbar();

  // Handles text-input on the sketch-name
  const handleInputChange = (e) => {
    props.setSketchName(e.target.value);
  };

  // Handles when the user wants to add (or update an existing) sketch.
  // The handler makes sure to trigger the model to update the local-storage,
  // and also update the local state.
  const handleSaveSketchClick = () => {
    // First we'll try to save the sketch to the local-storage. This method
    // will return an object stating if it could be saved or not.
    const { status, message } = props.model.addCurrentSketchToStorage({
      title: props.sketchName,
    });
    // Then we'll update the state with the new sketches and clear the text-field.
    props.setSavedSketches(props.model.getSketchesFromStorage());
    props.setSketchName("");
    // And prompt the user.
    enqueueSnackbar(message, {
      variant: status === "FAILED" ? "error" : "success",
    });
  };

  // Checks wether the sketch-name entered by the user is already taken or not.
  const nameExists = () => {
    return props.savedSketches.some(
      (sketch) => sketch.title.toLowerCase() === props.sketchName.toLowerCase()
    );
  };

  // Let's listen for enter-key-down. If the enter-key is pressed and
  // the save-button isn't disabled we can save the sketch.
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      !saveButtonState.disabled && handleSaveSketchClick();
    }
  };

  // Returns an object stating if the save-button should be disabled or not, along
  // with a tooltip-message.
  const getSaveButtonState = () => {
    // If the name consists of less than four characters, the button should be disabled.
    if (props.sketchName.length < 4) {
      return {
        disabled: true,
        message:
          "Minst fyra tecken måste anges för att en arbetsyta ska kunna skapas.",
      };
    }
    // If the name does not already exist, and we've already saved the maximum number of sketches,
    // the button should be disabled. (If the name does exist, it is OK to save since one
    // will be over-written).
    if (props.savedSketches.length === MAX_SKETCHES && !nameExists()) {
      return {
        disabled: true,
        message:
          "Maximalt antal arbetsytor har sparats. Ta bort eller skriv över en genom att ange ett av namnen i listan nedan.",
      };
    }
    // If we've made it this far, it is OK to save!
    return {
      disabled: false,
      message: "Klicka för att spara de ritobjekt som finns i kartan.",
    };
  };

  // We only allow workspace-names that consist of three characters or more.
  const saveButtonState = getSaveButtonState();

  return (
    <Paper style={{ padding: 8 }}>
      <Grid container alignItems="center" justifyContent="space-between">
        <Grid item xs={8}>
          <Tooltip
            disableInteractive
            title="Ange att namn så att arbetsytan kan identifieras senare."
          >
            <TextField
              size="small"
              variant="outlined"
              style={{ maxWidth: "100%" }}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              value={props.sketchName}
            />
          </Tooltip>
        </Grid>
        <Grid container item xs={3} justifyContent="flex-end">
          <Tooltip disableInteractive title={saveButtonState.message}>
            <span>
              <Button
                size="small"
                variant="contained"
                disabled={saveButtonState.disabled}
                onClick={handleSaveSketchClick}
              >
                Spara
              </Button>
            </span>
          </Tooltip>
        </Grid>
      </Grid>
    </Paper>
  );
};

// A simple component containing information about a saved sketch along
// with buttons allowing the user to add the sketch to the map, or delete
// the saved sketch entirely.
const SavedSketch = ({
  sketchInfo,
  handleRemoveClick,
  handleAddToMapClick,
}) => {
  return (
    <Zoom in appear>
      <StyledPaper>
        <Grid container justifyContent="space-between" alignItems="center">
          <Grid item xs={8}>
            <Tooltip disableInteractive title={sketchInfo.title}>
              <Grid
                item
                xs={12}
                sx={{ overflow: "hidden", textOverflow: "ellipsis" }}
              >
                <Typography variant="button" noWrap>
                  {sketchInfo.title}
                </Typography>
              </Grid>
            </Tooltip>
            <Grid item xs={12}>
              <Tooltip
                disableInteractive
                title={`Arbetsytan uppdaterades senast ${sketchInfo.date}`}
              >
                <Typography variant="caption">
                  {`Uppdaterad: ${sketchInfo.date?.split(" ")[0]}`}
                </Typography>
              </Tooltip>
            </Grid>
          </Grid>

          <Grid container item xs={4} justifyContent="flex-end">
            <Tooltip
              disableInteractive
              title="Klicka för att radera arbetsytan."
            >
              <IconButton size="small" onClick={handleRemoveClick}>
                <DeleteIcon />
              </IconButton>
            </Tooltip>
            <Tooltip
              disableInteractive
              title="Klicka för att läsa in objekten."
            >
              <IconButton size="small" onClick={handleAddToMapClick}>
                <AddIcon />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      </StyledPaper>
    </Zoom>
  );
};

const SavedSketchList = ({ model, savedSketches, setSavedSketches }) => {
  // We're gonna need a state to keep track of the sketch that the
  // user is about to remove. (So that we can make sure to confirm that
  // they want to remove it).
  const [sketchToRemove, setSketchToRemove] = React.useState(null);
  // Adds the features in the clicked sketch to the map.
  const handleAddToMapClick = (sketch) => {
    model.addSketchToMap(sketch);
  };
  // When the user clicks the remove-button, we'll set the clicked
  // sketch in state so that the user can confirm that they want to remove it.
  const handleRemoveClick = (sketch) => {
    setSketchToRemove(sketch);
  };
  // Fires when the user confirms that they want to remove the sketch. Removes the
  // sketch from LS.
  const handleRemoveConfirmation = () => {
    model.removeSketchFromStorage(sketchToRemove);
    setSavedSketches(
      savedSketches.filter(
        (s) => !model.equalsIgnoringCase(s.title, sketchToRemove.title)
      )
    );
    setSketchToRemove(null);
  };
  // Fires when the user closes the confirmation-window.
  const handleRemoveConfirmationAbort = () => {
    setSketchToRemove(null);
  };
  return (
    <Grid container>
      <Grid item xs={12}>
        <Typography variant="caption">
          {savedSketches.length === 0
            ? "Inga sparade arbetsytor hittades."
            : "Sparade arbetsytor:"}
        </Typography>
      </Grid>
      <Grid item xs={12}>
        {savedSketches.map((sketch) => {
          return (
            <SavedSketch
              key={sketch.id}
              sketchInfo={sketch}
              handleAddToMapClick={() => handleAddToMapClick(sketch)}
              handleRemoveClick={() => handleRemoveClick(sketch)}
            />
          );
        })}
      </Grid>
      <ConfirmationDialog
        open={sketchToRemove !== null}
        titleName={"Radera arbetsyta"}
        contentDescription={
          "Är du säker på att du vill radera arbetsytan? Detta går inte att ångra."
        }
        cancel={"Avbryt"}
        confirm={"Radera"}
        handleConfirm={handleRemoveConfirmation}
        handleAbort={handleRemoveConfirmationAbort}
      />
    </Grid>
  );
};

const SaveView = ({ globalObserver, model, id, functionalCookiesOk }) => {
  // If the user wants to save their work, they'll have to choose a name
  // so that the workspace can be identified in the list of saved workspaces later.
  const [sketchName, setSketchName] = React.useState("");
  // We also have to keep track of all the saved sketches. Initiate the state with the sketches
  // currently stored in the local-storage.
  const [savedSketches, setSavedSketches] = React.useState(
    model.getSketchesFromStorage()
  );
  // We have to get some information about the current activity (view)
  const activity = model.getActivityFromId(id);
  // Let's make sure we're allowing for functional cookies, and if we aren't
  // we'll render a view telling the user that the save-view does not work
  // until they've changed their settings.
  return !functionalCookiesOk ? (
    <NotSupportedView globalObserver={globalObserver} />
  ) : (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Information text={activity.information} />
      </Grid>
      <Grid item xs={12}>
        <SketchSaver
          model={model}
          sketchName={sketchName}
          setSketchName={setSketchName}
          savedSketches={savedSketches}
          setSavedSketches={setSavedSketches}
        />
      </Grid>
      <Grid item xs={12}>
        <SavedSketchList
          model={model}
          savedSketches={savedSketches}
          setSavedSketches={setSavedSketches}
        />
      </Grid>
    </Grid>
  );
};

export default SaveView;
