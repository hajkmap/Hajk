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
    allDocumentsToggled: false,
    chapterInformation: this.setChapterInfo()
  };

  handleCheckboxChange = chapter => {
    const { model } = this.props;
    let newChapterInformation = [...this.state.chapterInformation];

    let toggledChapter = model.getChapterById(
      newChapterInformation,
      chapter.id
    );
    toggledChapter.chosenForPrint = !toggledChapter.chosenForPrint;
    this.toggleSubChapters(toggledChapter, toggledChapter.chosenForPrint);

    this.setState({
      chapterInformation: newChapterInformation,
      allDocumentsToggled: false
    });
  };

  toggleSubChapters(chapter, checked) {
    if (Array.isArray(chapter.chapters) && chapter.chapters.length > 0) {
      chapter.chapters.forEach(subChapter => {
        subChapter.chosenForPrint = checked;
        this.toggleSubChapters(subChapter, checked);
      });
    }
  }

  setChapterInfo() {
    const { activeDocument, model } = this.props;
    let chapterInformation = model.getAllChapterInfo();

    let topChapter = chapterInformation.find(
      topChapter =>
        topChapter.headerIdentifier ===
        activeDocument.chapters[0].headerIdentifier
    );

    topChapter.chosenForPrint = true;
    this.toggleSubChapters(topChapter, true);

    return chapterInformation;
  }

  toggleAllDocuments = () => {
    this.state.chapterInformation.forEach(chapter => {
      chapter.chosenForPrint = !this.state.allDocumentsToggled;
      this.toggleSubChapters(chapter, !this.state.allDocumentsToggled);
    });

    this.setState({
      allDocumentsToggled: !this.state.allDocumentsToggled
    });
  };

  createPDF() {
    console.log("Printing... Printing...");
  }

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
    const { classes, togglePrintWindow, localObserver } = this.props;
    const { chapterInformation } = this.state;

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
            xs={12}
            style={{
              borderTop: "1px solid grey"
            }}
            container
            item
          >
            <Grid item xs={12}>
              <Typography variant="h6">Dokument</Typography>
            </Grid>
            <Grid item align="center" xs={4}>
              <FormControlLabel
                value="Välj alla dokument"
                control={
                  <Checkbox
                    color="primary"
                    checked={this.state.allDocumentsToggled}
                    onChange={this.toggleAllDocuments}
                  />
                }
                label="Välj alla dokument"
                labelPlacement="end"
              />
            </Grid>
          </Grid>
          <Grid xs={12} container item>
            <PrintList
              chapters={chapterInformation}
              handleCheckboxChange={this.handleCheckboxChange}
              localObserver={localObserver}
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
              onClick={this.createPDF}
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
