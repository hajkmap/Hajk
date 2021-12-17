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
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
} from "@material-ui/core";

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
    printLinks: true,
    printText: true,
    printImages: true,
    printMaps: false,
    allDocumentsToggled: false,
    tocPrintMode: this.props.options?.tableOfContents?.printMode ?? "none",
    menuInformation: this.createMenu(),
    printContent: undefined,
    pdfLoading: false,
    isAnyDocumentSelected: false,
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
      selected: !newItem.hasSubMenu,
      expandedSubMenu: newItem.hasSubMenu
        ? !newItem.expandedSubMenu
        : newItem.expandedSubMenu,
    };
  };

  #setNonClickedItemProperties = (item, currentState, clickedItem) => {
    return {
      ...item,
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
      <TableOfContents
        documentMenuState={this.state.menuInformation}
        allDocuments={this.props.model.allDocuments}
        mode={this.state.tocPrintMode}
      />,
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
            margin: 25mm 25mm 25mm 25mm;
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
    // Since we've altered the theme while printing, we must refresh to make sure
    // the original theme has the highest specificity when the printing is done.
    // Otherwise the entire application will follow the theming used in the print-contents.
    this.props.app.refreshMUITheme();
    // Then we'll update the view
    this.toggleAllDocuments(false);
    this.setState({
      pdfLoading: false,
      printContent: undefined,
      menuInformation: this.createMenu(),
    });
  };

  addPageBreaksBeforeHeadings = (printWindow) => {
    const headings = printWindow.document.body.querySelectorAll(["h1", "h2"]);
    //we don't want page breaks before a h2 if there is a h1 immediately before. In this case the H1 is the group parent heading.
    let isAfterH1 = false;
    let isConsecutiveH1 = false;

    for (let i = 0; i < headings.length; i++) {
      if (headings[i].nodeName === "H1" && isAfterH1) {
        isConsecutiveH1 = true;
      }
      if (headings[i].nodeName === "H1") {
        isAfterH1 = true;
      }

      //H1s are group headings and should start on a new page.
      if (
        headings[i].nodeName === "H1" &&
        this.state.tocPrintMode !== "none" &&
        !isConsecutiveH1
      ) {
        headings[i].style.pageBreakBefore = "always";
        headings[i].style.breakBefore = "none";
      }

      if (i !== 0 && headings[i].nodeName === "H2" && !isAfterH1) {
        headings[i].style.pageBreakBefore = "always";
        headings[i].style.breakBefore = "none";
      }

      if (headings[i].nodeName !== "H1") {
        isAfterH1 = false;
      }
    }
  };

  printContents = () => {
    Promise.all([
      this.state.tocPrintMode !== "none" && this.renderToc(),
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
        // When the user closes the print-window we have to do some cleanup...
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

  setInitialMenuItemProperties(menuItem) {
    if (hasSubMenu(menuItem)) {
      menuItem.hasSubMenu = true;
      menuItem.menu.forEach((subMenuItem) => {
        this.setInitialMenuItemProperties(subMenuItem, menuItem);
      });
    }
  }

  removeNonPrintableDocuments(documents) {
    /*
     * Remove menu items that should not appear in the print menu.
     * Items that should be removed are: items without a document that are not a group parent. (maplinks, links)
     */
    let removedIds = [];

    Object.keys(documents).forEach((key) => {
      if (documents[key].maplink.trim() || documents[key].link.trim()) {
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
    });
  }

  createMenu() {
    /* 
    Create a normalised menu structure for the print menu, similar to that of the panel menu, but only for printable documents. 
    */
    const { options } = this.props;

    const modelDocuments = this.props.model.allDocuments;
    const newOptions = { ...options };
    const menuConfig = { ...newOptions }.menuConfig;
    const menuConfigClone = JSON.parse(JSON.stringify(menuConfig));
    const menuStructure = getNormalizedMenuState(menuConfigClone.menu);
    let chapterInformation = this.props.model.getAllChapterInfo();

    const keys = Object.keys(menuStructure);
    const idOffset = keys.length + 1; //used to give new ids, so printMenu items do not get the same id as panelMenu items

    keys.forEach((key) => {
      let document = menuStructure[key];
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

      //add the table of contents settings from the document json.
      if (document.document) {
        let modelDoc = modelDocuments.find(
          (modelDoc) => modelDoc.documentFileName === document.document
        );
        document.tocChapterLevels =
          modelDoc?.tableOfContents?.chapterLevelsToShow || 100;
      }
      if (document.document) {
        document.chapters = [];
        let documentChapters = chapterInformation.filter(
          (chapter) => chapter.documentFileName === document.document
        );
        documentChapters.forEach((chapter) => document.chapters.push(chapter));
      }
    });

    let menuWithOffset = {};
    keys.forEach((key) => {
      let keyOffset = parseInt(key) + idOffset;
      menuWithOffset[keyOffset] = menuStructure[key];
    });

    this.removeNonPrintableDocuments(menuWithOffset);
    return menuWithOffset;
  }

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

  toggleParentChecked(documentId, menuState) {
    const parentId = menuState[documentId].parentId;
    const updatedParent = { ...menuState[parentId], chosenForPrint: true };
    menuState[parentId] = updatedParent;

    if (menuState[parentId].parentId) {
      menuState = this.toggleParentChecked(parentId, menuState);
    }

    return menuState;
  }

  toggleParentUnchecked(documentId, menuState) {
    const parentId = menuState[documentId].parentId;

    //if the parent has other children that are checked, do not toggle the parent.
    const hasOtherCheckedChildren =
      menuState[parentId].allChildren.filter((child) => {
        if (child.id !== documentId && menuState[child].chosenForPrint) {
          return true;
        } else return false;
      }).length > 0;

    if (hasOtherCheckedChildren) {
      return menuState;
    }

    const updatedParent = { ...menuState[parentId], chosenForPrint: false };
    menuState[parentId] = updatedParent;

    if (menuState[parentId].parentId) {
      menuState = this.toggleParentUnchecked(parentId, menuState);
    }
    return menuState;
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
    let updatedMenuState = this.toggleSubDocuments(
      documentId,
      shouldPrint,
      current
    );

    if (current[documentId].parentId && shouldPrint) {
      updatedMenuState = this.toggleParentChecked(documentId, updatedMenuState);
    }

    if (current[documentId].parentId && !shouldPrint) {
      updatedMenuState = this.toggleParentUnchecked(
        documentId,
        updatedMenuState
      );
    }

    this.setState({ menuInformation: updatedMenuState }, () => {
      this.setIsAnyDocumentSelected();
    });
  };

  toggleAllDocuments = (toggled) => {
    const menuState = { ...this.state.menuInformation };

    Object.keys(menuState).forEach((key) => {
      const updateDoc = {
        ...menuState[key],
        chosenForPrint: toggled,
      };
      menuState[key] = updateDoc;
    });

    this.setState({
      allDocumentsToggled: toggled,
      menuInformation: menuState,
      isAnyDocumentSelected: toggled,
    });
  };

  removeTagsNotSelectedForPrint = (chapter) => {
    const { printImages, printText, printLinks } = this.state;

    let elementsToRemove = [];
    const div = document.createElement("div");
    div.innerHTML = chapter.html;

    if (!printLinks) {
      Array.from(div.getElementsByTagName("a")).forEach((element) => {
        elementsToRemove.push(element);
      });
    }
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

    //ensure links to internal documents are no longer clickable.
    let documentLinks = div.querySelectorAll("[data-document]");
    for (let i = 0; i < documentLinks.length; i++) {
      documentLinks[i].setAttribute("printMode", "true");
      documentLinks[i].href = "#";
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
        } else {
          subChapter = this.removeTagsNotSelectedForPrint(subChapter);
        }
      });
    }
    chapter = this.removeTagsNotSelectedForPrint(chapter);
    return chapter;
  };

  setIsAnyDocumentSelected = () => {
    const keys = Object.keys(this.state.menuInformation);
    let isAnyDocumentSelected = false;

    for (let i = 0; i < keys.length; i++) {
      if (this.state.menuInformation[keys[i]].chosenForPrint) {
        isAnyDocumentSelected = true;
      }
    }
    this.setState({ isAnyDocumentSelected: isAnyDocumentSelected });
  };

  createHeaderItems = (menuItem) => {
    return { isGroupHeader: true, title: menuItem.title, id: menuItem.id };
  };

  getDocumentsToPrint = () => {
    const { menuInformation } = this.state;

    const documentIdsForPrint = Object.keys(menuInformation).filter(
      (key) => menuInformation[key].chosenForPrint
    );

    //create those without documents (header items) as a header item object.
    const documentNamesForPrint = documentIdsForPrint.map(
      (id) => menuInformation[id].document
    );

    //TODO - now that we get the document chapters earlier, do we need to get the document here?
    const originalDocs = this.props.model.getDocuments(documentNamesForPrint);

    let docs = originalDocs.map((doc) => {
      if (doc) {
        let menuDocKey = Object.keys(menuInformation).find(
          (key) => menuInformation[key].document === doc.documentFileName
        );
        return {
          documentFileName: doc.documentFileName,
          tableOfContents: doc.tableOfContents,
          chapters: menuInformation[menuDocKey].chapters,
        };
      } else {
        return undefined;
      }
    });

    /*
    where getDocuments returns an empty string. This is a menuItem without a corresponding document, which
    is a menu parent.
    */
    const docsIncludingGroupParent = docs.map((doc, index) => {
      if (doc === undefined) {
        return this.createHeaderItems(
          menuInformation[documentIdsForPrint[index]]
        );
      }
      return doc;
    });

    let newDocs = [];

    docsIncludingGroupParent.forEach((document) => {
      if (document?.chapters?.length) {
        let preparedChapters = [];
        document?.chapters.forEach((chapter) => {
          preparedChapters.push(this.prepareChapterForPrint(chapter));
        });
        document.chapters = preparedChapters;
      }
      newDocs.push(document);
    });

    return newDocs;
  };

  createPDF = () => {
    this.setState({ pdfLoading: true });
    const documentsToPrint = this.getDocumentsToPrint();
    this.props.localObserver.publish(
      "append-document-components",
      documentsToPrint
    );
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
          disabled={this.state.pdfLoading || !this.state.isAnyDocumentSelected}
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
    const { menuInformation } = this.state;
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
        </Grid>

        <Typography variant="h6">Valt innehåll</Typography>

        <Grid className={classes.middleContainer} item container>
          <PrintList
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
