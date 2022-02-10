import React from "react";
import { styled } from "@material-ui/core";
import { Button, IconButton, Zoom } from "@material-ui/core";
import { Grid, Typography, Tooltip, Paper } from "@material-ui/core";
import SettingsBackupRestoreIcon from "@material-ui/icons/SettingsBackupRestore";

import useCookieStatus from "hooks/useCookieStatus";
import Information from "../components/Information";

const StyledPaper = styled(Paper)(({ theme }) => ({
  width: "100%",
  padding: theme.spacing(1),
  marginBottom: theme.spacing(1),
  borderLeft: `${theme.spacing(0.5)}px solid ${theme.palette.success.main}`,
}));

// A component that is rendered if the user has selected not to accept functional
// cookies. (Functional cookies has to be accepted, otherwise we cannot save the
// recently removed features in LS.
const RecentlyRemovedNotSupported = ({ globalObserver }) => {
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
        detta så kan du inte se dina senast borttagna objekt. Klicka nedan för att ändra inställningarna."
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

const RemovedFeatureItem = ({ onRestoreClick, title }) => {
  return (
    <Zoom in appear>
      <StyledPaper>
        <Grid container justify="space-between" alignItems="center">
          <Typography variant="button">{title}</Typography>
          <Tooltip title="Klicka för att återställa ritobjektet.">
            <IconButton size="small" onClick={onRestoreClick}>
              <SettingsBackupRestoreIcon />
            </IconButton>
          </Tooltip>
        </Grid>
      </StyledPaper>
    </Zoom>
  );
};

const RemovedFeaturesList = ({ removedFeatures, drawModel }) => {
  return removedFeatures.map((feature) => {
    return (
      <RemovedFeatureItem
        key={feature.get("HANDLED_ID")}
        title={feature.get("HANDLED_AT")}
        onRestoreClick={() => drawModel.addFeature(feature)}
      />
    );
  });
};

const DeleteView = ({
  id,
  model,
  drawModel,
  removedFeatures,
  globalObserver,
}) => {
  // We're gonna need to keep track of if functional cookies are allowed or not
  // since we are saving the recently removed features in LS.
  const { functionalCookiesOk } = useCookieStatus(globalObserver);

  // We have to get some information about the current activity (view)
  const activity = model.getActivityFromId(id);

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Information text={activity.information} />
      </Grid>
      <Grid item xs={12}>
        <Button
          fullWidth
          variant="contained"
          onClick={drawModel.removeDrawnFeatures}
        >
          Ta bort alla ritobjekt
        </Button>
      </Grid>
      <Grid container item>
        <Grid item xs={12}>
          <Typography variant="caption">Senast borttagna:</Typography>
        </Grid>
        <Grid item xs={12}>
          {functionalCookiesOk ? (
            <RemovedFeaturesList
              drawModel={drawModel}
              removedFeatures={removedFeatures}
            />
          ) : (
            <RecentlyRemovedNotSupported globalObserver={globalObserver} />
          )}
        </Grid>
      </Grid>
    </Grid>
  );
};

export default DeleteView;
