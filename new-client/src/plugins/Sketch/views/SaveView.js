import React from "react";
import { styled } from "@material-ui/core";
import { Button, IconButton, Zoom } from "@material-ui/core";
import { Grid, Paper, TextField, Tooltip, Typography } from "@material-ui/core";
import AddIcon from "@material-ui/icons/Add";
import DeleteIcon from "@material-ui/icons/Delete";

import { MAX_SKETCHES } from "../constants";
import Information from "../components/Information";

const StyledPaper = styled(Paper)(({ theme }) => ({
  width: "100%",
  padding: theme.spacing(1),
  marginBottom: theme.spacing(1),
  borderLeft: `${theme.spacing(0.5)}px solid ${theme.palette.info.main}`,
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
  const handleInputChange = (e) => {
    props.setSketchName(e.target.value);
  };

  // Handles when the user wants to add (or update an existing) sketch.
  // The handler makes sure to trigger the model to update the local-storage,
  // and also update the local state.
  const handleSaveSketchClick = () => {
    props.model.addCurrentSketchToStorage({
      title: props.sketchName,
    });
    props.setSavedSketches(props.model.getSketchesFromStorage());
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
    // Let's check if the name the user has entered already exists
    const sketchNameExists = props.savedSketches.some(
      (sketch) => sketch.title.toLowerCase() === props.sketchName.toLowerCase()
    );
    // If the name does not exist, and we've already saved the maximum number of sketches,
    // the button should be disabled. (If the name does exist, it is OK to save since one
    // will be over-written).
    if (props.savedSketches.length === MAX_SKETCHES && !sketchNameExists) {
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
      <Grid container alignItems="center" justify="space-between">
        <Grid item xs={8}>
          <Tooltip title="Ange att namn så att arbetsytan kan identifieras senare.">
            <TextField
              size="small"
              variant="outlined"
              style={{ maxWidth: "100%" }}
              onChange={handleInputChange}
              value={props.sketchName}
            />
          </Tooltip>
        </Grid>
        <Grid container item xs={3} justify="flex-end">
          <Tooltip title={saveButtonState.message}>
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
        <Grid container justify="space-between" alignItems="center">
          <Grid item xs={8}>
            <Tooltip title={sketchInfo.title}>
              <Grid
                item
                xs={12}
                style={{ overflow: "hidden", textOverflow: "ellipsis" }}
              >
                <Typography variant="button" noWrap>
                  {sketchInfo.title}
                </Typography>
              </Grid>
            </Tooltip>
            <Grid item xs={12}>
              <Tooltip
                title={`Arbetsytan uppdaterades senast ${sketchInfo.date}`}
              >
                <Typography variant="caption">
                  {`Uppdaterad: ${sketchInfo.date?.split(" ")[0]}`}
                </Typography>
              </Tooltip>
            </Grid>
          </Grid>

          <Grid container item xs={4} justify="flex-end">
            <Tooltip title="Klicka för att radera arbetsytan.">
              <IconButton size="small" onClick={handleRemoveClick}>
                <DeleteIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Klicka för att läsa in objekten.">
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
  const handleAddToMapClick = (sketch) => {
    model.addSketchToMap(sketch);
  };

  const handleRemoveClick = (sketch) => {
    model.removeSketchFromStorage(sketch);
    setSavedSketches(
      savedSketches.filter(
        (s) => !model.equalsIgnoringCase(s.title, sketch.title)
      )
    );
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
