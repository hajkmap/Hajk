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
import PrintList from "./PrintList";

const styles = theme => ({
  gridContainer: {
    padding: theme.spacing(4),
    width: "100%"
  },
  footerContainer: {
    position: "fixed",
    padding: theme.spacing(2),
    maxWidth: "100%",
    bottom: 0,
    right: 0,
    borderTop: "1px solid grey"
  }
});

class PrintWindow extends React.PureComponent {
  state = {
    printText: false,
    printImages: false,
    printMaps: false,
    chapterInformation: this.props.model.getAllChapterInfo()
  };

  handleCheckboxChange = (e, chapter) => {
    e.stopPropagation();
    chapter.chosenForPrint = !chapter.chosenForPrint;
    if (Array.isArray(chapter.chapters) && chapter.chapters.length > 0) {
      chapter.chapters.forEach(subChapter => {
        subChapter.chosenForPrint = chapter.chosenForPrint;
      });
    }
  };

  renderCheckboxes() {
    return (
      <Grid container item alignItems="center" spacing={2}>
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
    console.log("this.state: ", this.state);

    return (
      <>
        <Grid
          spacing={2}
          className={classes.gridContainer}
          container
          alignItems="center"
        >
          <Grid alignItems="center" alignContent="center" container item xs>
            <Grid item xs={4}>
              <Button
                color="primary"
                startIcon={<ArrowBackIcon />}
                onClick={togglePrintWindow}
              >
                <Typography justify="center">Tillbaka</Typography>
              </Button>
            </Grid>

            <Grid item xs={4}>
              <Typography align="center" variant="h6">
                Skapa PDF
              </Typography>
            </Grid>
            <Grid item xs={4}></Grid>
          </Grid>
          {this.renderCheckboxes()}

          <Grid
            style={{
              borderTop: "1px solid grey"
            }}
            xs={12}
            container
            item
          >
            <PrintList
              chapters={this.state.chapterInformation}
              activeDocument={activeDocument}
            />
          </Grid>
        </Grid>
        <Grid container className={classes.footerContainer}>
          <Grid
            item
            xs={12}
            container
            alignContent="center"
            alignItems="center"
            justify="center"
          >
            <Button
              color="primary"
              variant="contained"
              startIcon={<OpenInNewIcon />}
              onClick={togglePrintWindow}
            >
              <Typography
                style={{ marginRight: "20px", marginLeft: "20px" }}
                justify="center"
              >
                Skapa PDF-utskrift
              </Typography>
            </Button>
          </Grid>
        </Grid>
      </>
    );
  }
}

export default withStyles(styles)(withSnackbar(PrintWindow));
