import React from "react";
import { styled } from "@material-ui/core";
import { Button, IconButton } from "@material-ui/core";
import { Grid, Paper, TextField, Tooltip, Typography } from "@material-ui/core";
import AddIcon from "@material-ui/icons/Add";
import DeleteIcon from "@material-ui/icons/Delete";

import { functionalOk } from "models/Cookie";
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
          size="small"
          variant="contained"
          onClick={handleChangeCookieSettingsClick}
        >
          Ändra cookie-inställningar
        </Button>
      </Grid>
    </Grid>
  );
};

// A simple component allowing the user to select a name and save the current
// sketch to LS under that name.
const SketchSaver = (props) => {
  const handleInputChange = (e) => {
    props.setWorkspaceName(e.target.value);
  };

  // We only allow workspace-names that consist of three characters or more.
  const workspaceNameHasEnoughChars = props.workspaceName.length > 2;

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
              value={props.workspaceName}
            />
          </Tooltip>
        </Grid>
        <Grid container item xs={3} justify="flex-end">
          <Tooltip
            title={
              workspaceNameHasEnoughChars
                ? "Klicka för att spara de ritobjekt som finns i kartan."
                : "Minst tre tecken måste anges för att ritobjekten ska kunna sparas."
            }
          >
            <span>
              <Button
                size="small"
                variant="contained"
                disabled={!workspaceNameHasEnoughChars}
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
const SavedSketch = (props) => {
  return (
    <StyledPaper>
      <Grid container justify="space-between" alignItems="center">
        <Grid item xs={8}>
          <Typography variant="button">{props.title}</Typography>
        </Grid>
        <Grid container item xs={4} justify="flex-end">
          <Tooltip title="Klicka för att radera arbetsytan.">
            <IconButton size="small" onClick={null}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Klicka för att läsa in objekten.">
            <IconButton size="small" onClick={null}>
              <AddIcon />
            </IconButton>
          </Tooltip>
        </Grid>
      </Grid>
    </StyledPaper>
  );
};

const SaveUploadView = ({ globalObserver, model, id }) => {
  // If the user wants to save their work, they'll have to choose a name
  // so that the workspace can be identified in the list of saved workspaces later.
  const [workspaceName, setWorkspaceName] = React.useState("");
  // We're gonna need to keep track of if functional cookies are allowed or not.
  // We can check if functional cookies are OK by calling functionalOk(), but we have
  // to make sure to re-render the component if the cookie-settings were to change (therefore
  // we'll persist a value in the local state as well).
  const [functionalCookiesOk, setFunctionalCookiesOk] = React.useState(
    functionalOk()
  );
  // An effect subscribing to an event sent from the cookie-handler when the
  // cookie-settings change. If the settings change, we make sure to update the
  // local state with the current settings so that we can render the appropriate component.
  React.useEffect(() => {
    globalObserver.subscribe("core.cookieLevelChanged", () =>
      setFunctionalCookiesOk(functionalOk())
    );
    return () => {
      globalObserver.unsubscribe("core.cookieLevelChanged");
    };
  }, [globalObserver]);

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
          workspaceName={workspaceName}
          setWorkspaceName={setWorkspaceName}
        />
      </Grid>
      <Grid item xs={12}>
        <SavedSketch title={"Detta är ett testobjekt lalala"} />
        <SavedSketch title={"Kortare test"} />
      </Grid>
    </Grid>
  );
};

export default SaveUploadView;
