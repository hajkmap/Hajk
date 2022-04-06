import React from "react";
import Grid from "@material-ui/core/Grid";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
} from "@material-ui/core";

const styles = (theme) => ({
  root: {
    display: "flex",
    flexWrap: "wrap",
  },
  formControl: {
    margin: theme.spacing(1),
    width: "100%",
  },
  printButton: {
    position: "fixed",
    bottom: theme.spacing(1),
    margin: theme.spacing(1),
    width: "90%",
  },
});

class GeneralOptions extends React.PureComponent {
  state = {
    anchorEl: null,
  };

  // Default colors for color picker used to set text color (used in map title, scale, etc)
  mapTextAvailableColors = [
    "#FFFFFF",
    "#D0021B",
    "#F5A623",
    "#F8E71C",
    "#8B572A",
    "#7ED321",
    "#417505",
    "#9013FE",
    "#4A90E2",
    "#50E3C2",
    "#B8E986",
    "#000000",
    "#4A4A4A",
    "#9B9B9B",
  ];

  render() {
    const {
      classes,
      useMargin,
      orientation,
      format,
      scale,
      scales,
      handleChange,
      model,
      saveAsType,
      printOptionsOk,
    } = this.props;
    return (
      <>
        <Grid container className={classes.root}>
          <FormControl className={classes.formControl}>
            <InputLabel htmlFor="format">Format</InputLabel>
            <Select
              value={format}
              onChange={handleChange}
              inputProps={{
                name: "format",
                id: "format",
              }}
            >
              {this.props.options.paperFormats.map((value, index) => {
                return (
                  <MenuItem key={"paperFormat_" + index} value={value}>
                    {value.toUpperCase()}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
          <FormControl className={classes.formControl}>
            <InputLabel htmlFor="useMargin">
              Marginaler runt kartbilden
            </InputLabel>
            <Select
              value={useMargin}
              onChange={handleChange}
              inputProps={{
                name: "useMargin",
                id: "useMargin",
              }}
            >
              <MenuItem value={true}>Ja</MenuItem>
              <MenuItem value={false}>Nej</MenuItem>
            </Select>
          </FormControl>
          <FormControl className={classes.formControl}>
            <InputLabel htmlFor="orientation">Orientering</InputLabel>
            <Select
              value={orientation}
              onChange={handleChange}
              inputProps={{
                name: "orientation",
                id: "orientation",
              }}
            >
              <MenuItem value={"landscape"}>Liggande</MenuItem>
              <MenuItem value={"portrait"}>Stående</MenuItem>
            </Select>
          </FormControl>

          <FormControl className={classes.formControl} error={!printOptionsOk}>
            <InputLabel htmlFor="scale">Skala</InputLabel>
            <Select
              value={scale}
              onChange={handleChange}
              inputProps={{
                name: "scale",
                id: "scale",
              }}
            >
              {scales.map((scale, i) => {
                // Note: it is crucial to keep the scale value (in state) divided by 1000 from what is shown to user!
                return (
                  <MenuItem key={i} value={scale}>
                    {model.getUserFriendlyScale(scale)}
                  </MenuItem>
                );
              })}
            </Select>
            {!printOptionsOk && (
              <FormHelperText>
                Bilden kommer inte kunna skrivas ut korrekt. Testa med en lägre
                upplösning eller mindre skala.
              </FormHelperText>
            )}
          </FormControl>
          <FormControl className={classes.formControl}>
            <InputLabel htmlFor="orientation">Spara som</InputLabel>
            <Select
              value={saveAsType}
              onChange={handleChange}
              inputProps={{
                name: "saveAsType",
                id: "saveAsType",
              }}
            >
              <MenuItem value={"PDF"}>PDF</MenuItem>
              <MenuItem value={"PNG"}>PNG</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </>
    );
  }
}

export default withStyles(styles)(withSnackbar(GeneralOptions));
