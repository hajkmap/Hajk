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
import PrintPreview from "./PrintPreview";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import CircularProgress from "@material-ui/core/CircularProgress";

const styles = (theme) => ({
  gridContainer: {
    padding: theme.spacing(4),
    width: "100%",
  },
  footerContainer: {
    position: "fixed",
    padding: theme.spacing(2),
    maxWidth: "100%",
    bottom: 0,
    right: 0,
    borderTop: "1px solid grey",
  },
});

class PrintWindow extends React.PureComponent {
  state = {
    printText: true,
    printImages: true,
    printMaps: true,
    allDocumentsToggled: false,
    chapterInformation: this.setChapterInfo(),
    printContent: undefined,
    pdfLoading: false,
  };

  constructor(props) {
    super(props);
    this.printPages = [{ availableHeight: 1070, content: [] }];
  }

  componentDidMount = () => {
    this.props.localObserver.subscribe(
      "chapter-components-appended",
      (renderedChapters) => {
        this.setState(
          {
            printContent: renderedChapters,
          },
          () => {
            this.printContents();
          }
        );
      }
    );
  };

  componentWillUnmount = () => {
    this.props.localObserver.unsubscribe("chapter-components-appended");
  };

  getAvailableHeight = () => {
    return this.printPages[this.printPages.length - 1].availableHeight;
  };

  divideContentOnPages = (content) => {
    const maxHeight = 900;
    let availableHeight = this.getAvailableHeight();
    let contentHeight = content.clientHeight;

    if (contentHeight >= availableHeight && content.children.length > 0) {
      [...content.children].forEach((child) => {
        this.divideContentOnPages(child);
      });
    } else if (
      contentHeight >= availableHeight &&
      content.children.length === 0
    ) {
      this.printPages.push({
        availableHeight: maxHeight - contentHeight,
        content: [content],
      });
    } else {
      this.printPages[
        this.printPages.length - 1
      ].availableHeight -= contentHeight;
      this.printPages[this.printPages.length - 1].content.push(content);
    }
  };

  getCanvasFromContent = (page) => {
    let sWidth = Math.round((210 * 90) / 25.4);
    let sHeight = 1120;
    let dWidth = Math.round((210 * 90) / 25.4);
    let dHeight = 1120;
    let onePageDiv = document.createElement("div");
    document.body.appendChild(onePageDiv);
    onePageDiv.style.width = `${21}cm`;
    onePageDiv.style.padding = "50px";

    page.content.forEach((child) => {
      onePageDiv.appendChild(child);
    });

    return new Promise((resolve, reject) => {
      html2canvas(onePageDiv, {}).then((canvas) => {
        let onePageCanvas = document.createElement("canvas");
        onePageCanvas.width = Math.round((210 * 90) / 25.4);
        onePageCanvas.height = 1120;

        let ctx = onePageCanvas.getContext("2d");
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, onePageCanvas.width, onePageCanvas.height);

        ctx.drawImage(canvas, 0, 0, sWidth, sHeight, 0, 0, dWidth, dHeight);
        document.body.removeChild(onePageDiv);
        resolve(onePageCanvas);
      });
    });
  };

  printContents = () => {
    const printContent = document.getElementById("printPreviewContent");
    this.printPages = [{ availableHeight: 1070, content: [] }];
    this.divideContentOnPages(printContent);
    let pdf = new jsPDF("p", "pt", "a4");
    let promises = [];

    this.printPages.forEach((page, index) => {
      promises.push(this.getCanvasFromContent(page));
    });

    Promise.all(promises).then((canvases) => {
      canvases.forEach((canvas, index) => {
        if (index > 0) {
          pdf.addPage(595, 842); //210" x 297" in pts
        }
        //! now we declare that we're working on that page
        pdf.setPage(index + 1);
        pdf.addImage(canvas, "JPG", 0, 0);
      });
      pdf.save("oversiktsplan.pdf");
      this.setState({ pdfLoading: false, printContent: undefined });
    });
  };

  handleCheckboxChange = (chapter) => {
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
      allDocumentsToggled: false,
    });
  };

  toggleSubChapters(chapter, checked) {
    if (Array.isArray(chapter.chapters) && chapter.chapters.length > 0) {
      chapter.chapters.forEach((subChapter) => {
        subChapter.chosenForPrint = checked;
        this.toggleSubChapters(subChapter, checked);
      });
    }
  }

  setChapterInfo() {
    const { activeDocument, model } = this.props;
    let chapterInformation = model.getAllChapterInfo();

    let topChapter = chapterInformation.find(
      (topChapter) =>
        topChapter.headerIdentifier ===
        activeDocument.chapters[0].headerIdentifier
    );

    topChapter.chosenForPrint = true;
    this.toggleSubChapters(topChapter, true);

    return chapterInformation;
  }

  toggleAllDocuments = () => {
    this.state.chapterInformation.forEach((chapter) => {
      chapter.chosenForPrint = !this.state.allDocumentsToggled;
      this.toggleSubChapters(chapter, !this.state.allDocumentsToggled);
    });

    this.setState({
      allDocumentsToggled: !this.state.allDocumentsToggled,
    });
  };

  removeTagsNotSelectedForPrint = (chapter) => {
    const { printImages, printText } = this.state;

    let elementsToRemove = [];
    const div = document.createElement("div");
    div.innerHTML = chapter.html;

    //A-tags should always be removed before printing
    Array.from(div.getElementsByTagName("a")).forEach((element) => {
      elementsToRemove.push(element);
    });
    if (!printImages) {
      Array.from(div.getElementsByTagName("figure")).forEach((element) => {
        elementsToRemove.push(element);
      });
    }
    if (!printText) {
      Array.from(div.querySelectorAll("p, h1, h2, h3, h4, h5, h6")).forEach(
        (element) => {
          elementsToRemove.push(element);
        }
      );
      chapter.header = "";
    }

    for (let i = 0; i < elementsToRemove.length; i++) {
      elementsToRemove[i].parentNode.removeChild(elementsToRemove[i]);
    }

    chapter.html = div.innerHTML;
    return chapter;
  };

  prepareChapterForPrint = (chapter) => {
    if (chapter.chapters && chapter.chapters.length > 0) {
      chapter.chapters.forEach((subChapter) => {
        if (subChapter.chapters && subChapter.chapters.length > 0) {
          return this.prepareChapterForPrint(subChapter);
        }
        if (!subChapter.chosenForPrint) {
          subChapter.html = "";
          subChapter.header = "";
        } else {
          subChapter = this.removeTagsNotSelectedForPrint(subChapter);
        }
      });
    }
    if (!chapter.chosenForPrint) {
      chapter.html = "";
      chapter.header = "";
    } else {
      chapter = this.removeTagsNotSelectedForPrint(chapter);
    }
    return chapter;
  };

  getChaptersToPrint = () => {
    let chaptersToPrint = JSON.parse(
      JSON.stringify(this.state.chapterInformation)
    );
    chaptersToPrint.forEach((chapter) => {
      chapter = this.prepareChapterForPrint(chapter);
    });

    return chaptersToPrint;
  };

  createPDF = () => {
    this.setState({ pdfLoading: true });
    const chaptersToPrint = this.getChaptersToPrint();
    this.props.localObserver.publish(
      "append-chapter-components",
      chaptersToPrint
    );
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
                    printText: !this.state.printText,
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
                    printImages: !this.state.printImages,
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
                    printMaps: !this.state.printMaps,
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

  renderCreatePDFButton() {
    const { classes } = this.props;
    return (
      <Grid container item className={classes.footerContainer}>
        <Grid
          item
          xs={12}
          container
          alignContent="center"
          alignItems="center"
          justify="center"
        >
          {!this.state.pdfLoading ? (
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
          ) : (
            <CircularProgress size={"2rem"} />
          )}
        </Grid>
      </Grid>
    );
  }

  renderPrintPreview = () => {
    return (
      <PrintPreview>
        <Grid
          style={{ padding: "50px", maxWidth: "100%" }}
          id={"printPreviewContent"}
          container
        >
          {this.state.printContent}
        </Grid>
      </PrintPreview>
    );
  };

  render() {
    const {
      classes,
      togglePrintWindow,
      localObserver,
      documentWindowMaximized,
    } = this.props;
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
              borderTop: "1px solid grey",
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
          {documentWindowMaximized && this.renderCreatePDFButton()}
        </Grid>
        {this.state.printContent && this.renderPrintPreview()}
      </>
    );
  }
}

export default withStyles(styles)(withSnackbar(PrintWindow));
