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

const StyledPaper = styled(Paper)(({ theme }) => ({
  width: "100%",
  padding: theme.spacing(1),
  marginBottom: theme.spacing(1),
  borderRight: `${theme.spacing(0.5)} solid ${theme.palette.info.main}`,
  borderLeft: `${theme.spacing(0.5)} solid ${theme.palette.info.main}`,
}));

const ButtonPanel = ({ kmlModel, gpxModel, setDialogOpen }) => {
  return (
    <Grid container spacing={1}>
      <Grid size={12}>
        <HajkToolTip title="Klicka för att öppna en dialog där du kan välja en .kml eller .gpx-fil från din dator.">
          <Button
            fullWidth
            variant="contained"
            onClick={() => setDialogOpen(true)}
            startIcon={<FolderOpenIcon />}
          >
            Importera ritobjekt
          </Button>
        </HajkToolTip>
      </Grid>
      <Grid size={12}>
        <HajkToolTip title="Klicka för att exportera alla ritobjekt till en .kml-fil. KML stödjer alla typer av geometrier inklusive polygoner, linjer, punkter och text.">
          <Button
            fullWidth
            variant="contained"
            onClick={() => kmlModel.export()}
            startIcon={<SaveAltIcon />}
          >
            Exportera till KML
          </Button>
        </HajkToolTip>
      </Grid>
      <Grid size={12}>
        <HajkToolTip title="Klicka för att exportera alla ritobjekt till en .gpx-fil. GPX stödjer endast punkter (waypoints) och linjer (tracks/routes). Polygoner och andra komplexa geometrier kommer att exkluderas.">
          <Button
            fullWidth
            variant="contained"
            onClick={() => gpxModel.export()}
            startIcon={<SaveAltIcon />}
          >
            Exportera till GPX
          </Button>
        </HajkToolTip>
      </Grid>
    </Grid>
  );
};

const UploadedFile = (props) => {
  return (
    <Zoom in appear>
      <StyledPaper>
        <Grid container justifyContent="space-between" alignItems="center">
          <Grid size={4}>
            <Typography variant="button">{props.title}</Typography>
          </Grid>
          <Grid container justifyContent="flex-end" spacing={1} size={8}>
            <Grid>
              <HajkToolTip title="Klicka för att ta bort de importerade objekten.">
                <IconButton size="small" onClick={props.onRemoveClick}>
                  <DeleteIcon />
                </IconButton>
              </HajkToolTip>
            </Grid>
            <Grid>
              <HajkToolTip
                title={`Klicka för att ${
                  props.hidden ? "visa" : "dölja"
                } objekten ${props.hidden ? "i" : "från"} kartan.`}
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
                title={`Klicka här för att ${
                  props.textShown ? "dölja" : "visa"
                } objektens etiketter.`}
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
        <Typography variant="caption">Uppladdade filer</Typography>
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

  // Adds the supplied file (kml/gpx string) to the map and updates the list
  // of added files.
  const handleUploadedFile = (file, fileType) => {
    // We're gonna need to generate an id that we can set on all the features
    // in each file. This id can then be used to find all features that belongs to
    // a file upload.
    const id = props.model.generateRandomString();
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
      { id, title: dateTime, hidden: false, textShown: true, type: fileType },
    ]);
    // Then we can add the features to the map!
    if (fileType === "kml") {
      props.kmlModel.import(file, {
        zoomToExtent: true,
        setProperties: { KML_ID: id },
      });
    } else if (fileType === "gpx") {
      props.gpxModel.import(file, {
        zoomToExtent: true,
        setProperties: { GPX_ID: id },
      });
    }
  };

  const onVisibilityChangeClick = (id, type) => {
    const updatedFiles = props.uploadedFiles.map((file) => {
      if (file.id === id) {
        return { ...file, hidden: !file.hidden };
      }
      return file;
    });
    if (type === "kml") {
      props.drawModel.toggleKmlFeaturesVisibility(id);
    } else if (type === "gpx") {
      props.drawModel.toggleGpxFeaturesVisibility(id);
    }
    props.setUploadedFiles(updatedFiles);
  };

  const onRemoveClick = (id, type) => {
    const updatedFiles = props.uploadedFiles.filter((file) => file.id !== id);
    if (type === "kml") {
      props.drawModel.removeKmlFeaturesById(id);
    } else if (type === "gpx") {
      props.drawModel.removeGpxFeaturesById(id);
    }
    props.setUploadedFiles(updatedFiles);
  };

  const onToggleShowTextClick = (id, type) => {
    const updatedFiles = props.uploadedFiles.map((file) => {
      if (file.id === id) {
        return { ...file, textShown: !file.textShown };
      }
      return file;
    });
    if (type === "kml") {
      props.drawModel.toggleKmlFeaturesTextVisibility(id);
    } else if (type === "gpx") {
      props.drawModel.toggleGpxFeaturesTextVisibility(id);
    }
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
          setDialogOpen={setDialogOpen}
        />
      </Grid>
      <Grid size={12}>
        {props.uploadedFiles.length > 0 && (
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
