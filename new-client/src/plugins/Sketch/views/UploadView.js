import React from "react";
import { Button, Grid, Tooltip } from "@material-ui/core";
import FolderOpenIcon from "@material-ui/icons/FolderOpen";
import SaveAltIcon from "@material-ui/icons/SaveAlt";

import Information from "../components/Information";
import UploadDialog from "../components/UploadDialog";

const ButtonPanel = ({ kmlModel, setDialogOpen }) => {
  return (
    <Grid container spacing={1}>
      <Grid item xs={12}>
        <Tooltip title="Klicka för att öppna en dialog där du kan välja en .kml-fil från din dator.">
          <Button
            fullWidth
            variant="contained"
            onClick={() => setDialogOpen(true)}
            startIcon={<FolderOpenIcon />}
          >
            Importera ritobjekt
          </Button>
        </Tooltip>
      </Grid>
      <Grid item xs={12}>
        <Tooltip title="Klicka för att exportera alla ritobjekt till en .kml-fil.">
          <Button
            fullWidth
            variant="contained"
            onClick={() => kmlModel.export()}
            startIcon={<SaveAltIcon />}
          >
            Exportera ritobjekt
          </Button>
        </Tooltip>
      </Grid>
    </Grid>
  );
};

const UploadView = (props) => {
  // We're gonna need to keep track of if we should show the upload-dialog or not.
  const [dialogOpen, setDialogOpen] = React.useState(false);
  // We're gonna keep track of the uploaded kml-files in an array. The array
  // will contain objects with an id (this id will be present on each feature
  // from that kml-file as well) along with a title that can be shown in the list.
  const [uploadedFiles, setUploadedFiles] = React.useState([]);

  // Adds the supplied file (kml-string) to the map and updates the list
  // of added kml-files.
  const handleUploadedFile = (file) => {
    // We're gonna need to generate an id that we can set on all the features
    // in each file. This id can then be used to find all features that belongs to
    // a kml-upload.
    const id = props.model.generateRandomString();
    // We're also gonna need to generate a date-time-string that can be shown in the list
    // of uploaded kml-files.
    const dateTime = props.model.getDateTimeString();
    // Let's create an object with some meta-data and add it to the array.
    setUploadedFiles(...uploadedFiles, { id, title: dateTime });
    // Then we can add the features to the map!
    props.kmlModel.import(file, {
      zoomToExtent: true,
      setProperties: { KML_ID: id },
    });
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
      <UploadDialog
        open={dialogOpen}
        setOpen={setDialogOpen}
        handleUploadedFile={handleUploadedFile}
      />
    </Grid>
  );
};

export default UploadView;
