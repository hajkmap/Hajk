import React from "react";
import {
  Button,
  Grid,
  Paper,
  Menu,
  MenuItem,
  Typography,
  Switch,
  ListItemIcon,
  ListItemText,
} from "@mui/material";

import {
  FlipToFront,
  FlipToBack,
  ArrowDropDown,
  ArrowDropUp,
  ContentCopy,
} from "@mui/icons-material/";
import HajkToolTip from "components/HajkToolTip";

import Information from "../components/Information";
import FeatureTitleEditor from "../components/FeatureTitleEditor";
import FeatureStyleEditor from "../components/featureStyle/FeatureStyleEditor";

const ModifyNodeToggler = ({ modifyEnabled, setModifyEnabled }) => {
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
      style={{ height: "100%" }}
    >
      <Grid container>
        <Grid item xs={12}>
          <Information text={activity.information} />
        </Grid>
        <Grid item xs={12}>
          <ModifyNodeToggler
            drawModel={props.drawModel}
            modifyEnabled={props.modifyEnabled}
            setModifyEnabled={props.setModifyEnabled}
          />
        </Grid>
        <Grid item xs={12}>
          {props.editFeature === null ? (
            <Typography align="center" style={{ marginTop: 24 }}>
              Klicka på ett objekt i kartan för att ändra dess utseende eller
              för att byta dess ritordning.
            </Typography>
          ) : (
            <Grid item xs={12}>
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
              />
            </Grid>
          )}
        </Grid>
      </Grid>
      {props.editFeature && (
        <Grid container style={{ marginTop: 8 }} spacing={2}>
          <Grid item xs={7}>
            <HajkToolTip title="Klicka för att duplicera det markerade objektet.">
              <Button
                variant="contained"
                fullWidth
                startIcon={<ContentCopy />}
                size="small"
                onClick={() => {
                  props.drawModel.duplicateFeature(props.editFeature);
                  props.drawModel.reBindFeaturePropertyListener();
                }}
              >
                Duplicera
              </Button>
            </HajkToolTip>
          </Grid>
          <Grid item xs={5}>
            <Button
              id="zIndexMenuButton"
              variant="contained"
              fullWidth
              onClick={handleZIndexMenu}
              endIcon={<ArrowDropDown />}
              size="small"
            >
              Ordna
            </Button>

            <Menu
              id="zindexmenu"
              anchorEl={zIndexAnchor}
              open={zIndexMenuOpen}
              onClose={handleZIndexMenuClose}
              MenuListProps={{
                "aria-labelledby": "zIndexMenuButton",
              }}
            >
              <MenuItem
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
