import React from "react";
import { Button, Grid, Tooltip } from "@material-ui/core";
import FolderOpenIcon from "@material-ui/icons/FolderOpen";
import SaveAltIcon from "@material-ui/icons/SaveAlt";
import Information from "../components/Information";

const ButtonPanel = ({ kmlModel }) => {
  return (
    <Grid container spacing={1}>
      <Grid item xs={12}>
        <Tooltip title="Klicka för att öppna en dialog där du kan välja en .kml-fil från din dator.">
          <Button
            fullWidth
            variant="contained"
            onClick={() => kmlModel.export()}
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
  // We have to get some information about the current activity (view)
  const activity = props.model.getActivityFromId(props.id);
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Information text={activity.information} />
      </Grid>
      <Grid item xs={12}>
        <ButtonPanel kmlModel={props.kmlModel} />
      </Grid>
    </Grid>
  );
};

export default UploadView;
