import React from "react";
import { styled } from "@mui/material";
import { Button, Grid, Typography } from "@mui/material";
import { IconButton, Zoom, Paper } from "@mui/material";

import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import SaveAltIcon from "@mui/icons-material/SaveAlt";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import VisibilityIcon from "@mui/icons-material/Visibility";
import TextDecreaseIcon from "@mui/icons-material/TextDecrease";
import TextIncreaseIcon from "@mui/icons-material/TextIncrease";

import Information from "../components/Information";
import UploadDialog from "../components/UploadDialog";
import HajkToolTip from "components/HajkToolTip";
import i18n from "src/i18n";

const StyledPaper = styled(Paper)(({ theme }) => ({
  width: "100%",
  padding: theme.spacing(1),
  marginBottom: theme.spacing(1),
  borderRight: `${theme.spacing(0.5)} solid ${theme.palette.info.main}`,
  borderLeft: `${theme.spacing(0.5)} solid ${theme.palette.info.main}`,
}));

const IMPORT_ID_PROPERTY = {
  kml: "KML_ID",
  gpx: "GPX_ID",
  geojson: "GEOJSON_ID",
};

const ButtonPanel = ({
  kmlModel,
  gpxModel,
  geoJsonModel,
  setDialogOpen,
  uiDisabled,
}) => {
  return (
    <Grid container spacing={1}>
      <Grid size={12}>
        <HajkToolTip title={i18n.t("sketch.upload.importHint")}>
          <Button
            fullWidth
            variant="contained"
            onClick={() => setDialogOpen(true)}
            startIcon={<FolderOpenIcon />}
          >
            {i18n.t("sketch.upload.import")}
          </Button>
        </HajkToolTip>
      </Grid>
      <Grid size={12}>
        <HajkToolTip title={i18n.t("sketch.upload.exportKmlHint")}>
          <span>
            <Button
              fullWidth
              variant="contained"
              onClick={() => kmlModel.export()}
              startIcon={<SaveAltIcon />}
              disabled={uiDisabled}
            >
              {i18n.t("sketch.upload.exportKml")}
            </Button>
          </span>
        </HajkToolTip>
      </Grid>
      <Grid size={12}>
        <HajkToolTip title={i18n.t("sketch.upload.exportGpxHint")}>
          <span>
            <Button
              fullWidth
              variant="contained"
              onClick={() => gpxModel.export()}
              startIcon={<SaveAltIcon />}
              disabled={uiDisabled}
            >
              {i18n.t("sketch.upload.exportGpx")}
            </Button>
          </span>
        </HajkToolTip>
      </Grid>
      <Grid size={12}>
        <HajkToolTip title={i18n.t("sketch.upload.exportGeoJsonHint")}>
          <span>
            <Button
              fullWidth
              variant="contained"
              onClick={() => geoJsonModel.export()}
              startIcon={<SaveAltIcon />}
              disabled={uiDisabled}
            >
              {i18n.t("sketch.upload.exportGeoJson")}
            </Button>
          </span>
        </HajkToolTip>
      </Grid>
    </Grid>
  );
};

const UploadedFile = (props) => {
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
          <Grid size={8}>
            <Typography variant="button" sx={{ textTransform: "none" }}>
              {props.title}
            </Typography>
          </Grid>
          <Grid
            container
            spacing={1}
            size={4}
            sx={{
              justifyContent: "flex-end",
            }}
          >
            <Grid>
              <HajkToolTip title={i18n.t("sketch.upload.removeImported")}>
                <IconButton size="small" onClick={props.onRemoveClick}>
                  <DeleteIcon />
                </IconButton>
              </HajkToolTip>
            </Grid>
            <Grid>
              <HajkToolTip
                title={
                  props.hidden
                    ? i18n.t("sketch.upload.showObjects")
                    : i18n.t("sketch.upload.hideObjects")
                }
              >
                <IconButton
                  size="small"
                  onClick={props.onVisibilityChangeClick}
                >
                  {props.hidden ? <VisibilityIcon /> : <VisibilityOffIcon />}
                </IconButton>
              </HajkToolTip>
            </Grid>
            <Grid>
              <HajkToolTip
                title={
                  props.textShown
                    ? i18n.t("sketch.upload.hideLabels")
                    : i18n.t("sketch.upload.showLabels")
                }
              >
                <IconButton size="small" onClick={props.onToggleShowTextClick}>
                  {props.textShown ? (
                    <TextDecreaseIcon />
                  ) : (
                    <TextIncreaseIcon />
                  )}
                </IconButton>
              </HajkToolTip>
            </Grid>
          </Grid>
        </Grid>
      </StyledPaper>
    </Zoom>
  );
};

const UploadedFileList = (props) => {
  return (
    <Grid container style={{ maxHeight: 240, overflowY: "auto" }}>
      <Grid size={12}>
        <Typography variant="caption">
          {i18n.t("sketch.upload.uploadedFiles")}
        </Typography>
      </Grid>
      <Grid size={12}>
        {props.uploadedFiles.map((file) => {
          return (
            <UploadedFile
              key={file.id}
              title={file.title}
              hidden={file.hidden}
              textShown={file.textShown}
              onVisibilityChangeClick={() =>
                props.onVisibilityChangeClick(file.id, file.type)
              }
              onRemoveClick={() => props.onRemoveClick(file.id, file.type)}
              onToggleShowTextClick={() =>
                props.onToggleShowTextClick(file.id, file.type)
              }
            />
          );
        })}
      </Grid>
    </Grid>
  );
};

const UploadView = (props) => {
  // We're gonna need to keep track of if we should show the upload-dialog or not.
  const [dialogOpen, setDialogOpen] = React.useState(false);

  // Adds the supplied file (kml/gpx/geojson string) to the map and updates the list
  // of added files.
  const handleUploadedFile = (file, fileName, fileType) => {
    // We're gonna need to generate an id that we can set on all the features
    // in each file. This id can then be used to find all features that belongs to
    // a file upload.
    const id = props.model.generateRandomString();
    const importModel = {
      kml: props.kmlModel,
      gpx: props.gpxModel,
      geojson: props.geoJsonModel,
    }[fileType];
    if (!importModel) {
      throw new Error(`Unsupported file type: ${fileType}`);
    }
    const result = importModel.import(file, {
      zoomToExtent: true,
      setProperties: { [IMPORT_ID_PROPERTY[fileType]]: id },
    });
    if (result.status === "FAILED") {
      throw result.error ?? new Error(`Failed to import ${fileName}`);
    }
    // We're also gonna need to generate a date-time-string that can be shown in the list
    // of uploaded files.
    const dateTime = props.model.getDateTimeString({
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    });
    // Let's create an object with some meta-data and add it to the list of uploaded files.
    props.setUploadedFiles((files) => [
      ...files,
      {
        id,
        title: `${fileName} (${dateTime})`,
        hidden: false,
        textShown: true,
        type: fileType,
      },
    ]);
  };

  const onVisibilityChangeClick = (id, type) => {
    const updatedFiles = props.uploadedFiles.map((file) => {
      if (file.id === id) {
        return { ...file, hidden: !file.hidden };
      }
      return file;
    });
    props.drawModel.toggleImportedFeaturesVisibility(
      IMPORT_ID_PROPERTY[type],
      id
    );
    props.setUploadedFiles(updatedFiles);
  };

  const onRemoveClick = (id, type) => {
    const updatedFiles = props.uploadedFiles.filter((file) => file.id !== id);
    props.drawModel.removeImportedFeaturesById(IMPORT_ID_PROPERTY[type], id);
    props.setUploadedFiles(updatedFiles);
  };

  const onToggleShowTextClick = (id, type) => {
    const updatedFiles = props.uploadedFiles.map((file) => {
      if (file.id === id) {
        return { ...file, textShown: !file.textShown };
      }
      return file;
    });
    props.drawModel.toggleImportedFeaturesTextVisibility(
      IMPORT_ID_PROPERTY[type],
      id
    );
    props.setUploadedFiles(updatedFiles);
  };

  // We have to get some information about the current activity (view)
  const activity = props.model.getActivityFromId(props.id);
  return (
    <Grid container spacing={2}>
      <Grid size={12}>
        <Information text={activity.information} />
      </Grid>
      <Grid size={12}>
        <ButtonPanel
          kmlModel={props.kmlModel}
          gpxModel={props.gpxModel}
          geoJsonModel={props.geoJsonModel}
          setDialogOpen={setDialogOpen}
          uiDisabled={props.uiDisabled}
        />
      </Grid>
      <Grid size={12}>
        {!props.uiDisabled && props.uploadedFiles.length > 0 && (
          <UploadedFileList
            uploadedFiles={props.uploadedFiles}
            onVisibilityChangeClick={onVisibilityChangeClick}
            onRemoveClick={onRemoveClick}
            onToggleShowTextClick={onToggleShowTextClick}
          />
        )}
      </Grid>
      <UploadDialog
        open={dialogOpen}
        setOpen={setDialogOpen}
        handleUploadedFile={handleUploadedFile}
      />
    </Grid>
  );
};

export default UploadView;
