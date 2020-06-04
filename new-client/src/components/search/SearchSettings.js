import React, { useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import FormGroup from "@material-ui/core/FormGroup";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";
import Switch from "@material-ui/core/Switch";
import { IconButton } from "@material-ui/core";
import Settings from "@material-ui/icons/Settings";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import FormatSizeIcon from "@material-ui/icons/FormatSize";
import ToggleButton from "@material-ui/lab/ToggleButton";
import IntersectsIcon from "@material-ui/icons/Toll";
import WithinIcon from "@material-ui/icons/Adjust";
import Checkbox from "@material-ui/core/Checkbox";
import TextField from "@material-ui/core/TextField";
import Autocomplete from "@material-ui/lab/Autocomplete";
import CheckBoxOutlineBlankIcon from "@material-ui/icons/CheckBoxOutlineBlank";
import CheckBoxIcon from "@material-ui/icons/CheckBox";

const useStyles = makeStyles(theme => ({
  form: {
    display: "flex",
    flexDirection: "column",
    width: "fit-content"
  },
  formControl: {
    marginTop: theme.spacing(2),
    minWidth: 120
  },
  formControlLabel: {
    marginTop: theme.spacing(1)
  }
}));

export default function SearchSettings(props) {
  const classes = useStyles();

  const searchModel = props.app.appModel.searchModel;

  // Select search sources
  const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
  const checkedIcon = <CheckBoxIcon fontSize="small" />;
  const [open, setOpen] = useState(false);
  const [searchSources, setSearchSources] = useState(searchModel.getSources());

  // Settings to be sent to SearchModel
  const [activeSpatialFilter, setActiveSpatialFilter] = useState("intersects");
  const [matchCase, setMatchCase] = useState(false);
  const [wildcardAtEnd, setWildcardAtEnd] = useState(true);
  const [wildcardAtStart, setWildcardAtStart] = useState(false);

  const searchSettings = [
    {
      activeSpatialFilter: activeSpatialFilter,
      matchCase: matchCase,
      wildcardAtEnd: wildcardAtEnd,
      wildcardAtStart: wildcardAtStart
    }
  ];

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    props.handleSearchSources(searchSources);
    props.handleSearchSettings(searchSettings);
  };

  const handleWildcardAtStart = event => {
    setWildcardAtStart(event.target.checked);
  };

  const handleWildcardAtEnd = event => {
    setWildcardAtEnd(event.target.checked);
  };

  const handleMatchCase = event => {
    setMatchCase(event.target.checked);
  };

  return (
    <React.Fragment>
      <IconButton variant="outlined" color="primary" onClick={handleClickOpen}>
        <Settings />
      </IconButton>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Inställningar</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Avancerade inställningar för att göra en detaljerad sökning.
          </DialogContentText>
          <FormGroup className={classes.form} noValidate>
            <Typography component="div">
              <Grid component="label" container spacing={1}>
                <Grid item>Wildcard före *.</Grid>
                <Grid item>
                  <Switch
                    checked={wildcardAtStart}
                    onChange={handleWildcardAtStart}
                    color="primary"
                  />
                </Grid>
              </Grid>
              <Grid component="label" container spacing={1}>
                <Grid item>Wildcard efter .*</Grid>
                <Grid item>
                  <Switch
                    checked={wildcardAtEnd}
                    onChange={handleWildcardAtEnd}
                    color="primary"
                  />
                </Grid>
              </Grid>
              <Grid component="label" container spacing={1}>
                <Grid item>
                  Versaler
                  <FormatSizeIcon />
                </Grid>
                <Grid item>
                  <Switch
                    checked={matchCase}
                    onChange={handleMatchCase}
                    color="primary"
                  />
                </Grid>
              </Grid>
              <Grid component="label" container spacing={1}>
                <Grid item>Sökområde</Grid>
                <Grid item>
                  <ToggleButton
                    value="activeSpatialFilter"
                    selected={activeSpatialFilter === "intersects"}
                    onChange={() =>
                      setActiveSpatialFilter(
                        activeSpatialFilter === "intersects"
                          ? "within"
                          : "intersects"
                      )
                    }
                  >
                    {activeSpatialFilter === "intersects" ? (
                      <IntersectsIcon />
                    ) : (
                      <WithinIcon />
                    )}
                  </ToggleButton>
                </Grid>
              </Grid>
              <Grid component="label" container spacing={1}>
                <Grid item>Sökkälla</Grid>
                <Grid item>
                  <Autocomplete
                    multiple
                    id="searchSources"
                    value={searchSources}
                    onChange={(event, value, reason) => {
                      setSearchSources(value);
                    }}
                    options={searchModel.getSources()}
                    disableCloseOnSelect
                    getOptionLabel={option => option.caption}
                    renderOption={(option, { selected }) => (
                      <React.Fragment>
                        <Checkbox
                          icon={icon}
                          checkedIcon={checkedIcon}
                          style={{ marginRight: 8 }}
                          checked={selected}
                          color="primary"
                        />
                        {option.caption}
                      </React.Fragment>
                    )}
                    style={{ width: 500 }}
                    renderInput={params => (
                      <TextField {...params} variant="outlined" />
                    )}
                  />
                </Grid>
              </Grid>
            </Typography>
          </FormGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Stäng
          </Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
}
