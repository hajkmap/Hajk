import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import Grid from "@material-ui/core/Grid";
import { Typography } from "@material-ui/core";
import Button from "@material-ui/core/Button";
import ArrowBackIcon from "@material-ui/icons/ArrowBack";
import Checkbox from "@material-ui/core/Checkbox";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import OpenInNewIcon from "@material-ui/icons/OpenInNew";
import { borderTop } from "@material-ui/system";

const styles = theme => ({
  headerContainer: {
    backgroundColor: theme.palette.grey[200],
    display: "flex",
    justifyContent: "center",
    padding: theme.spacing(2)
  },
  checkBoxContainer: {
    padding: theme.spacing(2)
  },
  footerContainer: {
    position: "fixed",
    bottom: theme.spacing(2),
    display: "flex",
    justifyContent: "center"
  }
});

class PrintWindow extends React.PureComponent {
  state = {
    showScrollButton: false,
    showPrintWindow: false,
    printText: false,
    printImages: false,
    printMaps: false
  };

  constructor(props) {
    super(props);
  }

  renderCheckboxes() {
    return (
      <Grid container alignItems="center" spacing={1}>
        <Grid item xs={12}>
          <Typography variant="h6">Innehåll</Typography>
        </Grid>
        <Grid item xs align="center">
          <FormControlLabel
            value="Texter"
            control={
              <Checkbox
                color="primary"
                checked={this.state.printText}
                onChange={() => {
                  this.setState({
                    printText: !this.state.printText
                  });
                }}
              />
            }
            label="Texter"
            labelPlacement="end"
          />
        </Grid>
        <Grid item xs align="center">
          <FormControlLabel
            value="Bilder"
            control={
              <Checkbox
                color="primary"
                checked={this.state.printImages}
                onChange={() => {
                  this.setState({
                    printImages: !this.state.printImages
                  });
                }}
              />
            }
            label="Bilder"
            labelPlacement="end"
          />
        </Grid>
        <Grid item xs align="center">
          <FormControlLabel
            value="Kartor"
            control={
              <Checkbox
                color="primary"
                checked={this.state.printMaps}
                onChange={() => {
                  this.setState({
                    printMaps: !this.state.printMaps
                  });
                }}
              />
            }
            label="Kartor"
            labelPlacement="end"
          />
        </Grid>
      </Grid>
    );
  }

  render() {
    const { classes, togglePrintWindow, activeDocument } = this.props;
    console.log("activeDocument: ", activeDocument);

    return (
      <>
        <div className={classes.headerContainer}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs>
              <Button
                color="primary"
                startIcon={<ArrowBackIcon />}
                onClick={togglePrintWindow}
              >
                <Typography justify="center">Tillbaka</Typography>
              </Button>
            </Grid>
            <Grid item xs align="center">
              <Typography variant="h6">Skapa PDF</Typography>
            </Grid>
            <Grid item xs></Grid>
          </Grid>
        </div>
        <div className={classes.checkBoxContainer}>
          {this.renderCheckboxes()}
        </div>
        <Grid
          container
          className={classes.footerContainer}
          alignItems="center"
          spacing={3}
        >
          <Grid
            item
            align="center"
            xs={12}
            style={{ borderTop: "1px solid grey" }}
          >
            <Button
              color="primary"
              variant="contained"
              startIcon={<OpenInNewIcon />}
              onClick={togglePrintWindow}
            >
              <Typography justify="center">Skapa PDF-utskrift</Typography>
            </Button>
          </Grid>
        </Grid>
      </>
    );
  }
}

export default withStyles(styles)(withSnackbar(PrintWindow));
