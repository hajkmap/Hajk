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

const ButtonPanel = ({ kmlModel, setDialogOpen }) => {
  return (
    <Grid container spacing={1}>
      <Grid item xs={12}>
        <HajkToolTip title="Klicka för att öppna en dialog där du kan välja en .kml-fil från din dator.">
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
      <Grid item xs={12}>
        <HajkToolTip title="Klicka för att exportera alla ritobjekt till en .kml-fil.">
          <Button
            fullWidth
            variant="contained"
            onClick={() => kmlModel.export()}
            startIcon={<SaveAltIcon />}
          >
            Exportera ritobjekt
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
          <Grid item xs={4}>
            <Typography variant="button">{props.title}</Typography>
          </Grid>
          <Grid container item xs={8} justifyContent="flex-end" spacing={1}>
            <Grid item>
              <HajkToolTip title="Klicka för att ta bort de importerade objekten.">
                <IconButton size="small" onClick={props.onRemoveClick}>
                  <DeleteIcon />
                </IconButton>
              </HajkToolTip>
            </Grid>
            <Grid item>
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
            <Grid item>
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
      <Grid item xs={12}>
        <Typography variant="caption">Uppladdade filer</Typography>
      </Grid>
      <Grid item xs={12}>
        {props.uploadedFiles.map((file) => {
          return (
            <UploadedFile
              key={file.id}
              title={file.title}
              hidden={file.hidden}
              textShown={file.textShown}
              onVisibilityChangeClick={() =>
                props.onVisibilityChangeClick(file.id)
              }
              onRemoveClick={() => props.onRemoveClick(file.id)}
              onToggleShowTextClick={() => props.onToggleShowTextClick(file.id)}
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

  // Adds the supplied file (kml-string) to the map and updates the list
  // of added kml-files.
  const handleUploadedFile = (file) => {
    // We're gonna need to generate an id that we can set on all the features
    // in each file. This id can then be used to find all features that belongs to
    // a kml-upload.
    const id = props.model.generateRandomString();
    // We're also gonna need to generate a date-time-string that can be shown in the list
    // of uploaded kml-files.
    const dateTime = props.model.getDateTimeString({
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    });
    // Let's create an object with some meta-data and add it to the list of uploaded files.
    props.setUploadedFiles((files) => [
      ...files,
      { id, title: dateTime, hidden: false, textShown: true },
    ]);
    // Then we can add the features to the map!
    props.kmlModel.import(file, {
      zoomToExtent: true,
      setProperties: { KML_ID: id },
    });
  };

  const onVisibilityChangeClick = (id) => {
    const updatedFiles = props.uploadedFiles.map((file) => {
      if (file.id === id) {
        return { ...file, hidden: !file.hidden };
      }
      return file;
    });
    props.drawModel.toggleKmlFeaturesVisibility(id);
    props.setUploadedFiles(updatedFiles);
  };

  const onRemoveClick = (id) => {
    const updatedFiles = props.uploadedFiles.filter((file) => file.id !== id);
    props.drawModel.removeKmlFeaturesById(id);
    props.setUploadedFiles(updatedFiles);
  };

  const onToggleShowTextClick = (id) => {
    const updatedFiles = props.uploadedFiles.map((file) => {
      if (file.id === id) {
        return { ...file, textShown: !file.textShown };
      }
      return file;
    });
    props.drawModel.toggleKmlFeaturesTextVisibility(id);
    props.setUploadedFiles(updatedFiles);
  };

  // We have to get some information about the current activity (view)
  const activity = props.model.getActivityFromId(props.id);
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Information text={activity.information} />
      </Grid>
      <Grid item xs={12}>
        <ButtonPanel kmlModel={props.kmlModel} setDialogOpen={setDialogOpen} />
      </Grid>
      <Grid item xs={12}>
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
