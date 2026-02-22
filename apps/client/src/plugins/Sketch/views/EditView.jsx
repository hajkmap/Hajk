import React from "react";
import {
  Button,
  Paper,
  Menu,
  MenuItem,
  Typography,
  Switch,
  ListItemIcon,
  ListItemText,
  Grid,
} from "@mui/material";

import {
  FlipToFront,
  FlipToBack,
  ArrowDropDown,
  ArrowDropUp,
  ContentCopy,
} from "@mui/icons-material";
import HajkToolTip from "components/HajkToolTip";

import Information from "../components/Information";
import FeatureTitleEditor from "../components/FeatureTitleEditor";
import FeatureStyleEditor from "../components/featureStyle/FeatureStyleEditor";

const ModifyNodeToggler = ({
  modifyEnabled,
  setModifyEnabled,
  disabled = false,
}) => {
  return (
    <Paper style={{ padding: 8, marginTop: 8 }}>
      <Grid container justifyContent="space-between" alignItems="center">
        <Typography variant="body2">Tillåt redigering av noder</Typography>
        <HajkToolTip
          title={
            modifyEnabled
              ? "Avaktivera redigering av noder för att enklare kunna selektera objekt i kartan för redigering av färg etc."
              : "Aktivera för att kunna redigera objektens utbredning i kartan."
          }
        >
          <Switch
            checked={modifyEnabled}
            onChange={() => setModifyEnabled(!modifyEnabled)}
            size="small"
            color="primary"
          />
        </HajkToolTip>
      </Grid>
    </Paper>
  );
};

const EditView = (props) => {
  const { uiDisabled = false } = props;
  // We have to get some information about the current activity (view)
  const activity = props.model.getActivityFromId(props.id);

  // Z-Index order related
  const [zIndexAnchor, setZIndexAnchor] = React.useState(null);
  const zIndexMenuOpen = Boolean(zIndexAnchor);
  const handleZIndexMenu = (e) => {
    setZIndexAnchor(e.currentTarget);
  };
  const handleZIndexMenuClose = () => {
    setZIndexAnchor(null);
  };

  return (
    <Grid
      container
      direction="column"
      justifyContent="space-between"
      sx={{ height: "100%" }}
    >
      <Grid container size={12}>
        <Grid size={12}>
          <Information text={activity.information} />
        </Grid>
        <Grid size={12}>
          <ModifyNodeToggler
            drawModel={props.drawModel}
            modifyEnabled={props.modifyEnabled}
            setModifyEnabled={props.setModifyEnabled}
            disabled={uiDisabled}
          />
        </Grid>
        <Grid size={12}>
          {props.editFeature === null ? (
            <Typography align="center" style={{ marginTop: 24 }}>
              Klicka på ett objekt i kartan för att ändra dess utseende eller
              för att byta dess ritordning.
            </Typography>
          ) : (
            <Grid size={12}>
              {props.editFeature?.get?.("__ae_style_delegate") === true ? (
                <Typography align="center" style={{ marginTop: 24 }}>
                  Detta objekt hanteras av redigerbart lager.
                </Typography>
              ) : (
                <div
                  style={{
                    pointerEvents: uiDisabled ? "none" : "auto",
                    opacity: uiDisabled ? 0.5 : 1,
                    transition: "opacity 0.2s ease",
                  }}
                >
                  <FeatureTitleEditor
                    feature={props.editFeature}
                    model={props.model}
                    drawModel={props.drawModel}
                  />
                  <FeatureStyleEditor
                    feature={props.editFeature}
                    model={props.model}
                    drawModel={props.drawModel}
                    bufferState={props.bufferState}
                    setBufferState={props.setBufferState}
                    disabled={uiDisabled}
                  />
                </div>
              )}
            </Grid>
          )}
        </Grid>
      </Grid>
      {props.editFeature && (
        <Grid container style={{ marginTop: 8 }} spacing={2}>
          <Grid size={7}>
            <HajkToolTip title="Klicka för att duplicera det markerade objektet.">
              <span style={{ display: "inline-block", width: "100%" }}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<ContentCopy />}
                  size="small"
                  disabled={uiDisabled}
                  onClick={() => {
                    props.drawModel.duplicateFeature(props.editFeature);
                    props.drawModel.reBindFeaturePropertyListener();
                  }}
                >
                  Duplicera
                </Button>
              </span>
            </HajkToolTip>
          </Grid>
          <Grid size={5}>
            <Button
              id="zIndexMenuButton"
              variant="contained"
              fullWidth
              onClick={handleZIndexMenu}
              endIcon={<ArrowDropDown />}
              size="small"
              disabled={uiDisabled}
            >
              Ordna
            </Button>

            <Menu
              id="zindexmenu"
              anchorEl={zIndexAnchor}
              open={zIndexMenuOpen}
              onClose={handleZIndexMenuClose}
              slotProps={{
                list: {
                  "aria-labelledby": "zIndexMenuButton",
                },
              }}
            >
              <MenuItem
                disabled={uiDisabled}
                onClick={() => {
                  props.drawModel.moveFeatureZIndexToTop(props.editFeature);
                }}
              >
                <ListItemIcon>
                  <FlipToFront fontSize="small" />
                </ListItemIcon>
                <ListItemText>Placera längst fram</ListItemText>
              </MenuItem>

              <MenuItem
                onClick={() => {
                  props.drawModel.moveFeatureZIndexUp(props.editFeature);
                }}
              >
                <ListItemIcon>
                  <ArrowDropUp fontSize="small" />
                </ListItemIcon>
                <ListItemText>Flytta framåt</ListItemText>
              </MenuItem>

              <MenuItem
                onClick={() => {
                  props.drawModel.moveFeatureZIndexDown(props.editFeature);
                }}
              >
                <ListItemIcon>
                  <ArrowDropDown fontSize="small" />
                </ListItemIcon>
                <ListItemText>Flytta bakåt</ListItemText>
              </MenuItem>

              <MenuItem
                onClick={() => {
                  props.drawModel.moveFeatureZIndexToBottom(props.editFeature);
                }}
              >
                <ListItemIcon>
                  <FlipToBack fontSize="small" />
                </ListItemIcon>
                <ListItemText>Placera längst bak</ListItemText>
              </MenuItem>
            </Menu>
          </Grid>
        </Grid>
      )}
    </Grid>
  );
};

export default EditView;
