import React from "react";
import { createPortal } from "react-dom";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import Grid from "@material-ui/core/Grid";
import { Typography } from "@material-ui/core";
import ReactDOM from "react-dom";
import Button from "@material-ui/core/Button";
import ArrowBackIcon from "@material-ui/icons/ArrowBack";
import Checkbox from "@material-ui/core/Checkbox";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import OpenInNewIcon from "@material-ui/icons/OpenInNew";
import PrintList from "./PrintList";
import TableOfContents from "./TableOfContents";
import { ThemeProvider } from "@material-ui/styles";
import { getNormalizedMenuState } from "../utils/stateConverter";
import { hasSubMenu } from "../utils/helpers";
import {
  isExpandedTopLevelItem,
  getItemIdsToColor,
} from "../panelMenu/panelMenuUtils";

import {
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
} from "@material-ui/core";
import { Menu } from "@material-ui/icons";

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
    menuInformation: this.createMenu(),
    chapterInformation: this.setChapterInfo(),
    printContent: undefined,
    pdfLoading: false,
  };

  internalId = 0;

  #handleSubMenuClicked = (id) => {
    this.#setItemStateProperties(id);
  };

  #setItemStateProperties = (idClicked) => {
    return new Promise((resolve) => {
      const currentState = { ...this.state.menuInformation };
      const clickedItem = currentState[idClicked];
      const newState = Object.values(currentState).reduce((items, item) => {
        const isClickedItem = item.id === idClicked;
        if (isClickedItem) {
          return {
            ...items,
            [item.id]: this.#setClickedItemProperties(item),
          };
        } else {
          return {
            ...items,
            [item.id]: this.#setNonClickedItemProperties(
              item,
              currentState,
              clickedItem
            ),
          };
        }
      }, {});

      this.setState({ menuInformation: newState }, resolve);
    });
  };

  #setClickedItemProperties = (clickedItem) => {
    let newItem = { ...clickedItem };
    return {
      ...clickedItem,
      //colored: !isExpandedTopLevelItem(newItem),
      selected: !newItem.hasSubMenu,
      expandedSubMenu: newItem.hasSubMenu
        ? !newItem.expandedSubMenu
        : newItem.expandedSubMenu,
    };
  };

  #setNonClickedItemProperties = (item, currentState, clickedItem) => {
    //const idsToColor = getItemIdsToColor(clickedItem, currentState);
    return {
      ...item,
      //colored: idsToColor.indexOf(item.id) !== -1,
      expandedSubMenu:
        clickedItem.allParents.indexOf(item.id) !== -1
          ? true
          : item.expandedSubMenu,
      selected: clickedItem.hasSubMenu ? item.selected : false,
    };
  };

  componentDidMount = () => {
    this.props.localObserver.subscribe(
      "chapter-components-appended",
      (renderedChapters) => {
        console.log(renderedChapters);
        debugger;
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

    this.props.localObserver.subscribe("print-submenu-clicked", (id) => {
      this.#handleSubMenuClicked(id);
    });
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
        <ThemeProvider theme={this.props.customTheme || this.props.theme}>
          {element}
        </ThemeProvider>,
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
    console.log("renderContent:", this.content);
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
        console.log("printContents - this.content: ", this.content);
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

  //Change to toggle sub documents.
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

    //chapterInformation is an array of chapterObjects.
    console.log("setChapterInfo: chapterInformation", chapterInformation);

    //the below segment just sets the chapter that was clicked to come into print as active.

    // let topChapter = chapterInformation.find(
    //   (topChapter) =>
    //     topChapter.headerIdentifier ===
    //     activeDocument.chapters[0].headerIdentifier
    // );

    // topChapter.chosenForPrint = true;
    // this.toggleSubChapters(topChapter, true);

    return chapterInformation;
  }

  setInitialMenuItemProperties(menuItem) {
    if (hasSubMenu(menuItem)) {
      menuItem.hasSubMenu = true;
      menuItem.menu.forEach((subMenuItem) => {
        this.setInitialMenuItemProperties(subMenuItem, menuItem);
      });
    }
  }

  removeNonPrintableDocuments(documents) {
    //Remove items that should not appear in the print menu (maplinks, links)
    let removedIds = [];

    Object.keys(documents).forEach((key) => {
      if (documents[key].maplink || documents[key].link) {
        removedIds.push(parseInt(key));
        delete documents[key];
      }
    });

    Object.keys(documents).forEach((key) => {
      let item = documents[key];

      //if a document has been removed from the printMenu, also remove its id from the children array of other documents.
      let newChildren = item.allChildren.filter(
        (child) => !removedIds.includes(child)
      );
      item.allChildren = newChildren;
      //also remove its id from the menuItemIds of other documents.
      let newMenuItemIds = item.menuItemIds.filter(
        (id) => !removedIds.includes(id)
      );
      item.menuItemIds = newMenuItemIds;
      //we should not need to remove it from the allParents array, as a Link menu item cannot be a parent.
    });
  }

  createMenu() {
    const { options } = this.props;

    const newOptions = { ...options };
    const menuConfig = { ...newOptions }.menuConfig;
    const clone = JSON.parse(JSON.stringify(menuConfig));
    const a = getNormalizedMenuState(clone.menu);

    const keys = Object.keys(a);
    const idOffset = keys.length + 1;

    keys.forEach((key) => {
      let document = a[key];
      const offsetChildren = document.allChildren.map((id) => (id += idOffset));
      const offsetParents = document.allParents.map((id) => (id += idOffset));
      const offsetMenuItemIds = document.menuItemIds.map(
        (id) => (id += idOffset)
      );

      document.id += idOffset;
      document.parentId = document.parentId
        ? (document.parentId += idOffset)
        : null;
      document.allChildren = offsetChildren;
      document.allParents = offsetParents;
      document.menuItemIds = offsetMenuItemIds;

      document.chosenForPrint = false;
      document.colored = true;
    });

    let keys2 = Object.keys(a);

    let newObj = {};
    keys2.forEach((key) => {
      let keyOffset = parseInt(key) + idOffset;
      newObj[keyOffset] = a[key];
    });

    this.removeNonPrintableDocuments(newObj);
    return newObj;
  }

  //Change to toggle sub documents.
  toggleSubDocuments(documentId, checked, menuState) {
    const subDocuments = menuState[documentId].allChildren;
    subDocuments.forEach((subDocId) => {
      const updateDoc = {
        ...menuState[subDocId],
        chosenForPrint: checked,
      };
      menuState[subDocId] = updateDoc;
      this.toggleSubDocuments(subDocId, checked, menuState);
    });

    return menuState;
  }

  toggleParents(documentId, checked) {
    //if a child documents is untoggled, it's holding parent element should no longer be toggled?
    console.log("toggleParents");
    //allParents
  }

  toggleChosenForPrint = (documentId) => {
    const current = { ...this.state.menuInformation };
    const shouldPrint = !current[documentId].chosenForPrint;

    const updateDoc = {
      ...current[documentId],
      chosenForPrint: !current[documentId].chosenForPrint,
    };
    current[documentId] = updateDoc;

    /*
    update child documents (toggle subDocuments does not set state itself, but returns an object
    that we can use to update the state along with out parent document, so we only make one state update.) 
    */
    const updatedMenuState = this.toggleSubDocuments(
      documentId,
      shouldPrint,
      current
    );

    this.setState({ menuInformation: updatedMenuState });
  };

  toggleAllDocuments = (toggled) => {
    const menuState = { ...this.state.menuInformation };

    Object.keys(menuState).forEach((key) => {
      console.log(menuState[key]);
      const updateDoc = {
        ...menuState[key],
        chosenForPrint: toggled,
      };
      menuState[key] = updateDoc;
    });

    this.setState({ allDocumentsToggled: toggled, menuInformation: menuState });
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

  getDocumentsToPrint = () => {
    //earlier we kept koll på chapters hela tiden.
    //nu ska vi bara hämta upp de när vi klicka print.
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

  isAnyDocumentSelected = () => {
    const keys = Object.keys(this.state.menuInformation);
    for (let i = 0; i < keys.length; i++) {
      if (this.state.menuInformation[keys[i]].chosenForPrint) {
        return true;
      }
    }
    return false;
  };

  //TODO - change to documents
  // isAnyChapterSelected = () => {
  //   const { chapterInformation } = this.state;
  //   for (let i = 0; i < chapterInformation.length; i++) {
  //     if (this.checkIfChaptersSelected(chapterInformation[i])) {
  //       return true;
  //     }
  //   }
  //   return false;
  // };

  getDocumentsToPrint = () => {
    const { menuInformation } = this.state;
    console.log("getDocumentsToPrint");
    console.log(this.state.menuInformation);

    const documentIdsForPrint = Object.keys(menuInformation).filter(
      (key) => menuInformation[key].chosenForPrint
    );

    const documentNamesForPrint = documentIdsForPrint.map(
      (id) => menuInformation[id].document
    );

    const docs = this.props.model.getDocuments(documentNamesForPrint);
    console.log(docs);

    //parentTitle

    return docs;
  };

  createPDF = () => {
    console.log(this.state.chapterInformation);
    console.log(this.state.menuInformation);
    if (!this.isAnyDocumentSelected()) {
      this.props.enqueueSnackbar(
        "Du måste välja minst ett dokument för att kunna skapa en PDF.",
        {
          variant: "warning",
          persist: false,
        }
      );
    } else {
      this.setState({ pdfLoading: true });
      //const documentsToPrint
      const documentsToPrint = this.getDocumentsToPrint().filter(
        (doc) => doc !== undefined
      );
      this.props.localObserver.publish(
        "append-document-components",
        documentsToPrint
      );
      //const chaptersToPrint = this.getChaptersToPrint(); //change to get documents to print?
      // this.props.localObserver.publish(
      //   "append-chapter-components",
      //   chaptersToPrint
      // );
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
        justify="center"
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
          <Dialog
            disableBackdropClick={true}
            disableEscapeKeyDown={true}
            open={this.state.pdfLoading}
          >
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
    const { chapterInformation, menuInformation } = this.state;
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
            documentMenu={menuInformation}
            level={0}
            handleTogglePrint={this.toggleChosenForPrint}
          />
        </Grid>

        {documentWindowMaximized && this.renderCreatePDFButton()}
        {this.renderLoadingDialog()}
      </Grid>
    );
  }
}

export default withStyles(styles)(withSnackbar(PrintWindow));
