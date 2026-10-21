import { styled } from "@mui/material";
import { Button, IconButton, Zoom } from "@mui/material";
import { Grid, Typography, Paper } from "@mui/material";
import SettingsBackupRestoreIcon from "@mui/icons-material/SettingsBackupRestore";
import DeleteIcon from "@mui/icons-material/Delete";
import HajkToolTip from "components/HajkToolTip";

import Information from "../components/Information";
import i18n from "src/i18n";

const StyledPaper = styled(Paper)(({ theme }) => ({
  width: "100%",
  padding: theme.spacing(1),
  marginBottom: theme.spacing(1),
  borderRight: `${theme.spacing(0.5)} solid ${theme.palette.info.main}`,
  borderLeft: `${theme.spacing(0.5)} solid ${theme.palette.info.main}`,
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
      <Grid size={12}>
        <Information text={i18n.t("sketch.delete.cookiesRequired")} />
      </Grid>
      <Grid size={12}>
        <Button
          fullWidth
          variant="contained"
          onClick={handleChangeCookieSettingsClick}
        >
          {i18n.t("common.cookieSettings")}
        </Button>
      </Grid>
    </Grid>
  );
};

const RemovedFeatureItem = ({ onRestoreClick, title }) => {
  return (
    <Zoom in appear>
      <StyledPaper>
        <Grid
          container
          sx={{
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="button">{title}</Typography>
          <HajkToolTip title={i18n.t("sketch.delete.restoreHint")}>
            <IconButton size="small" onClick={onRestoreClick}>
              <SettingsBackupRestoreIcon />
            </IconButton>
          </HajkToolTip>
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
  functionalCookiesOk,
  uiDisabled,
}) => {
  // We have to get some information about the current activity (view)
  const activity = model.getActivityFromId(id);

  return (
    <Grid container spacing={2}>
      <Grid size={12}>
        <Information text={activity.information} />
      </Grid>
      <Grid size={12}>
        <Button
          fullWidth
          variant="contained"
          onClick={drawModel.removeDrawnFeatures}
          startIcon={<DeleteIcon />}
          disabled={uiDisabled}
        >
          {i18n.t("sketch.delete.deleteAll")}
        </Button>
      </Grid>
      <Grid container>
        <Grid size={12}>
          <Typography variant="caption">
            {i18n.t("sketch.delete.recentlyDeleted")}
          </Typography>
        </Grid>
        <Grid size={12}>
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
