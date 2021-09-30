import React from "react";
import { createPortal } from "react-dom";
import withStyles from "@mui/styles/withStyles";
import { withSnackbar } from "notistack";
import Grid from "@mui/material/Grid";
import { Typography } from "@mui/material";
import ReactDOM from "react-dom";
import Button from "@mui/material/Button";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PrintList from "./PrintList";
import TableOfContents from "./TableOfContents";
import { StyledEngineProvider } from "@mui/material/styles";
import { ThemeProvider } from "@mui/styles";

import {
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
} from "@mui/material";

const styles = (theme) => ({
  gridContainer: {
    padding: theme.spacing(4),
    height: "100%",
  },
  middleContainer: {
    overflowX: "auto",
    flexBasis: "100%",
    marginTop: theme.spacing(2),
  },
  headerContainer: {
    marginBottom: theme.spacing(2),
  },
  settingsContainer: {
    marginBottom: theme.spacing(2),
  },
  footerContainer: {
    flexBasis: "10%",
  },
});

const maxHeight = 950;
const imageResizeRatio = 0.7;

class PrintWindow extends React.PureComponent {
  state = {
    printText: true,
    printImages: true,
    printMaps: false,
    allDocumentsToggled: false,
    includeCompleteToc: true,
    chapterInformation: this.setChapterInfo(),
    printContent: undefined,
    pdfLoading: false,
  };

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

  resizeImage = (img) => {
    img.height = img.getBoundingClientRect().height * imageResizeRatio;
    img.width = img.clientWidth * imageResizeRatio;
  };

  imageFitsOnePage = (img) => {
    return img.getBoundingClientRect().height < maxHeight * 0.9;
  };

  loadImage = (img) => {
    return new Promise((resolve, reject) => {
      img.onload = () => {
        if (this.imageFitsOnePage(img)) {
          resolve(img);
        } else {
          this.resizeImage(img);
          resolve(img);
        }
      };
      img.onerror = () => reject(img);
    });
  };

  customRender = (element, container) => {
    return new Promise((resolve) => {
      ReactDOM.render(
        <StyledEngineProvider injectFirst>
          <ThemeProvider theme={this.props.customTheme || this.props.theme}>
            {element}
          </ThemeProvider>
        </StyledEngineProvider>,
        container,
        (e) => {
          resolve();
        }
      );
    });
  };

  createPrintElement = (id) => {
    let div = document.createElement("div");
    div.id = id;
    return div;
  };

  renderToc = () => {
    this.toc = this.createPrintElement("toc");
    return this.customRender(
      <TableOfContents chapters={this.state.chapterInformation} />,
      this.toc
    );
  };

  renderContent = () => {
    this.content = this.createPrintElement("content");
    return this.customRender(this.state.printContent, this.content);
  };

  areAllImagesLoaded = () => {
    return Promise.allSettled(
      [...this.content.getElementsByTagName("img")].map((img) => {
        return this.loadImage(img);
      })
    );
  };

  getCurrentStyleTags = () => {
    const styleTags = [];
    [...document.head.children].forEach((c) => {
      if (c.nodeName === "STYLE") {
        styleTags.push(c.cloneNode(true));
      }
    });
    return styleTags;
  };

  handleNewWindowBlocked = () => {
    window.alert(
      "Please allow opening of popup windows in order to print this document."
    );

    this.setState({
      pdfLoading: false,
      printContent: undefined,
      printMaps: false,
    });

    return null;
  };

  createPrintWindow = () => {
    const printWindow = window.open("", "PRINT");

    if (printWindow === null) {
      return this.handleNewWindowBlocked();
    }

    this.getCurrentStyleTags().forEach((tag) => {
      printWindow.document.head.appendChild(tag);
    });

    printWindow.document.head.insertAdjacentHTML(
      "beforeend",
      ` <title>${document.title}</title>
        <style>
          @page {
            size: A4;
          }
          @media print {
            html,
            body {
              height: 297mm;
              width: 210mm;
            }
            h1,
            h2,
            h3,
            h4,
            h5,
            h6 {
              page-break-after: avoid;
            }
            MuiTypography-body1 {
              page-break-before: avoid;
            }
            .MuiBox-root {
              page-break-inside: avoid;
            }
          }        
        </style>`
    );

    return printWindow;
  };

  clearPrintContainers = () => {
    this.toc = null;
    this.content = null;
  };

  handlePrintCompleted = () => {
    this.toggleAllDocuments(false);
    this.setState({
      pdfLoading: false,
      printContent: undefined,
      printMaps: false,
    });
  };

  addPageBreaksBeforeHeadings = (printWindow) => {
    const headings = printWindow.document.body.querySelectorAll(["h1", "h2"]);
    for (let i = 0; i < headings.length; i++) {
      if (i !== 0 || this.state.includeCompleteToc) {
        headings[i].style.pageBreakBefore = "always";
        headings[i].style.breakBefore = "none";
      }
    }
  };

  printContents = () => {
    Promise.all([
      this.state.includeCompleteToc && this.renderToc(),
      this.renderContent(),
    ]).then(() => {
      this.areAllImagesLoaded().then(() => {
        const printWindow = this.createPrintWindow();
        this.toc && printWindow.document.body.appendChild(this.toc);
        printWindow.document.body.appendChild(this.content);
        this.addPageBreaksBeforeHeadings(printWindow);
        printWindow.document.close(); // necessary for IE >= 10
        printWindow.focus(); // necessary for IE >= 10*/
        printWindow.print();
        printWindow.close();

        this.handlePrintCompleted();
      });
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

  toggleAllDocuments = (toggled) => {
    this.state.chapterInformation.forEach((chapter) => {
      chapter.chosenForPrint = toggled;
      this.toggleSubChapters(chapter, toggled);
    });

    this.setState({
      allDocumentsToggled: toggled,
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

  checkIfChaptersSelected = (chapter) => {
    let subChapters = chapter.chapters;
    if (chapter.chosenForPrint) {
      return true;
    } else if (subChapters && subChapters.length > 0) {
      for (let i = 0; i < subChapters.length; i++) {
        let subChapter = subChapters[i];
        if (this.checkIfChaptersSelected(subChapter)) {
          return true;
        }
      }
    }
    return false;
  };

  isAnyChapterSelected = () => {
    const { chapterInformation } = this.state;
    for (let i = 0; i < chapterInformation.length; i++) {
      if (this.checkIfChaptersSelected(chapterInformation[i])) {
        return true;
      }
    }
    return false;
  };

  createPDF = () => {
    if (!this.isAnyChapterSelected()) {
      this.props.enqueueSnackbar(
        "Du måste välja minst ett kapitel för att kunna skapa en PDF.",
        {
          variant: "warning",
          persist: false,
        }
      );
    } else {
      this.setState({ pdfLoading: true });
      const chaptersToPrint = this.getChaptersToPrint();
      this.props.localObserver.publish(
        "append-chapter-components",
        chaptersToPrint
      );
    }
  };

  renderCreatePDFButton() {
    const { classes } = this.props;
    return (
      <Grid
        item
        className={classes.footerContainer}
        container
        alignContent="center"
        alignItems="center"
        justifyContent="center"
      >
        <Button
          color="primary"
          variant="contained"
          disabled={this.state.pdfLoading}
          startIcon={<OpenInNewIcon />}
          onClick={this.createPDF}
        >
          <Typography
            style={{ marginRight: "20px", marginLeft: "20px" }}
            justify="center"
          >
            Skriv ut
          </Typography>
        </Button>
      </Grid>
    );
  }

  renderLoadingDialog = () => {
    return (
      <>
        {createPortal(
          <Dialog disableEscapeKeyDown={true} open={this.state.pdfLoading}>
            <LinearProgress />
            <DialogTitle>Din PDF skapas</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Det här kan ta en stund, speciellt om du har valt att skriva ut
                många dokument.
                <br />
                <br />
              </DialogContentText>
            </DialogContent>
          </Dialog>,
          document.getElementById("root")
        )}
      </>
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
      <Grid
        container
        className={classes.gridContainer}
        wrap="nowrap"
        direction="column"
      >
        <Grid
          className={classes.headerContainer}
          alignItems="center"
          item
          container
        >
          <Grid item xs={4}>
            <Button
              color="primary"
              style={{ paddingLeft: 0 }}
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
        </Grid>

        <Grid container item className={classes.settingsContainer}>
          <Typography variant="h6">Inställningar</Typography>

          <Grid xs={12} item>
            <FormControlLabel
              value="Välj alla dokument"
              control={
                <Checkbox
                  color="primary"
                  checked={this.state.allDocumentsToggled}
                  onChange={() =>
                    this.toggleAllDocuments(!this.state.allDocumentsToggled)
                  }
                />
              }
              label="Välj alla dokument"
              labelPlacement="end"
            />
          </Grid>

          <Grid xs={12} item>
            <FormControlLabel
              value="Inkludera hela innehållsförteckningen"
              control={
                <Checkbox
                  color="primary"
                  checked={this.state.includeCompleteToc}
                  onChange={() =>
                    this.setState({
                      includeCompleteToc: !this.state.includeCompleteToc,
                    })
                  }
                />
              }
              label="Inkludera hela innehållsförteckningen"
              labelPlacement="end"
            />
          </Grid>
        </Grid>

        <Typography variant="h6">Valt innehåll</Typography>

        <Grid className={classes.middleContainer} item container>
          <PrintList
            chapters={chapterInformation}
            handleCheckboxChange={this.handleCheckboxChange}
            localObserver={localObserver}
          />
        </Grid>

        {documentWindowMaximized && this.renderCreatePDFButton()}
        {this.renderLoadingDialog()}
      </Grid>
    );
  }
}

export default withStyles(styles)(withSnackbar(PrintWindow));
