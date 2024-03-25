import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { createPortal } from "react-dom";
import { withSnackbar } from "notistack";
import {
  styled,
  StyledEngineProvider,
  ThemeProvider,
  useTheme,
} from "@mui/material/styles";
import {
  Button,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  FormControlLabel,
  Grid,
  LinearProgress,
  Typography,
  List,
  ListItemButton,
  DialogActions,
  useMediaQuery,
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

import { deepMerge } from "../../../utils/DeepMerge";

import PrintList from "./PrintList";
import TableOfContents from "./TableOfContents";
import { getNormalizedMenuState } from "../utils/stateConverter";
import { hasSubMenu } from "../utils/helpers";

const GridGridContainer = styled(Grid)(({ theme }) => ({
  padding: theme.spacing(3),
  height: "100%",
  overflowX: "auto",
}));

const GridMiddleContainer = styled(Grid)(({ theme }) => ({
  marginTop: theme.spacing(2),
  overflowX: "auto",
  "&::-webkit-scrollbar": {
    width: "0.4em",
    opacity: "0",
  },
  "&:hover": {
    "&::-webkit-scrollbar": {
      opacity: "1",
    },
    "&::-webkit-scrollbar-track": {
      boxShadow: "inset 0 0 6px rgba(0,0,0,0.00)",
      webkitBoxShadow: "inset 0 0 6px rgba(0,0,0,0.00)",
    },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor: "rgba(0,0,0,.1)",
    },
  },
  flexBasis: "100%",
}));

const GridHeaderContainer = styled(Grid)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

const GridSettingsContainer = styled(Grid)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

const GridFooterContainer = styled(Grid)(({ theme }) => ({
  flexBasis: "10%",
}));

const StyledGrid = styled(Grid)(({ theme }) => ({
  display: "flex",
  justifyContent: "flex-end",
}));

const StyledListItemButton = styled(ListItemButton)(({ theme, index }) => ({
  display: "flex",
  justifyContent: "space-between",
  padding: "16px 10px 16px 10px",
  borderBottom: "1px solid lightgray",
  borderLeft: index % 2 === 0 ? "4px solid lightGray" : "4px solid darkGray",
}));

const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
  overflowY: "clip",
  position: "relative",
  "&:before": {
    display: "block",
    content: `""`,
    width: "100%",
    paddingTop: "141.15%",
    paddingLeft: "80%",
  },
}));

const StyledIframe = styled("iframe")(({ theme }) => ({
  position: "absolute",
  width: "calc(100% - 40px)",
  height: "100%",
  top: "0",
  left: "0",
  margin: "20px",
}));

const maxHeight = 950;
const imageResizeRatio = 0.7;

function ComponentWithRenderCallback({ callback, children }) {
  useEffect(() => callback());

  return <div>{children}</div>;
}

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
    showAttachments: false,
    selectedPdfIndex: null,
    isModalOpen: false,
    pdfLinks: this.checkPdfLinks(this.props.options.pdfLinks),
    frontPage: null,
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
    // Since the ThemeProvider seems to cache the theme in some way, we have to make sure to
    // create a new theme-reference to make sure that the correct theme is used when rendering.
    // If we don't create a new reference, the custom-theme will be overridden by the standard MUI-theme
    // since the standard MUI-theme is refreshed (and thereby has the highest css-specificity) sometimes.
    // This is quite messy, but get's the job done. See issue #999 for more info.
    const theme = deepMerge(this.props.customTheme || this.props.theme, {});
    // Make sure to render the components using the custom theme if it exists:
    return new Promise((resolve) => {
      const rootElement = createRoot(container);
      rootElement.render(
        <StyledEngineProvider>
          <ThemeProvider theme={theme}>
            <ComponentWithRenderCallback
              callback={() => {
                resolve();
              }}
            >
              {element}
            </ComponentWithRenderCallback>
          </ThemeProvider>
        </StyledEngineProvider>
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

  renderFrontPage = () => {
    this.frontPageElement = this.createPrintElement("frontPage");
    const frontPage = this.state.frontPage;
    const titles =
      frontPage.titles.length > 3
        ? frontPage.titles.slice(0, 3).join(", ") + "..."
        : frontPage.titles.join(", ");
    console.log(titles);
    return this.customRender(
      <Grid container direction="column" sx={{ pageBreakAfter: "always" }}>
        <Grid item textAlign="center" sx={{ paddingBottom: "60px" }}>
          <Typography
            variant="h1"
            gutterBottom={true}
            sx={{ fontSize: "46px" }}
          >
            FÖRDJUPAD ÖVERSIKTSPLAN VÄRÖBACKA
          </Typography>
          <Typography variant="h4" gutterBottom={true} component="div">
            {titles}
          </Typography>
        </Grid>
        <Grid item textAlign="center">
          <img
            src={"https://html.com/wp-content/uploads/flamingo.jpg"}
            alt=""
            style={{ margin: "auto" }} // Add this style to center align the image
          />
        </Grid>
      </Grid>,
      this.frontPageElement
    );
  };

  renderContent = () => {
    this.content = this.createPrintElement("content");
    return this.customRender(this.state.printContent, this.content);
  };

  areAllImagesLoaded = () => {
    const frontPageImgElement = this.frontPageElement.querySelector("img");

    // Create a promise for the frontPageImgElement
    const frontPageImgPromise = this.loadImage(frontPageImgElement);

    // Get all img elements inside this.content and create promises for each
    const imgPromises = [...this.content.getElementsByTagName("img")].map(
      (img) => {
        return this.loadImage(img);
      }
    );

    // Add frontPageImgPromise to the array of promises
    imgPromises.push(frontPageImgPromise);

    // Use Promise.allSettled to wait for all promises to resolve
    return Promise.allSettled(imgPromises);
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

    printWindow.document.head.insertAdjacentHTML(
      "beforeend",
      ` <title>${document.title}</title>
        <base href="${document.location.protocol}//${
          document.location.host
        }/" />
        ${
          this.props.options.dynamicImportUrls.customFont
            ? `<link
            rel="stylesheet"
            type="text/css"
            href="${this.props.options.dynamicImportUrls.customFont}"/>`
            : ""
        }        
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
            .MuiTypography-body1 {
              page-break-before: avoid;
            }
            .MuiBox-root {
              page-break-inside: avoid;
            }
            body .blockQuoteAccordion {
              box-shadow: none;
              border: 4px solid #edf2f7;
            }
            .blockQuoteAccordion .MuiCollapse-root {
              height: auto;
              visibility: visible;
            }
            .blockQuoteAccordion .MuiAccordionSummary-expandIconWrapper {
              display: none;
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
    // FIXME: This might not be needed after the upgrade to React 18. Let's ensure that's the
    // case and remove if so.
    // this.props.app.refreshMUITheme();

    // Then we'll update the view
    this.toggleAllDocuments(false);
    this.setState({
      pdfLoading: false,
      printContent: undefined,
      menuInformation: this.createMenu(),
    });
  };

  addPageBreaksBeforeHeadings = (printContent) => {
    const headings = printContent.querySelectorAll(["h1", "h2"]);

    // We don't want page breaks before a H2 if there is a H1 immediately before.
    // In this case the H1 is the group parent heading.
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

  // Creates a new window, appends all elements that should be printed, and invokes
  // window.print(), allowing the user to save the document as a PDF (or print it straight away).
  printContents = () => {
    // We're gonna want to make sure everything is rendered...
    Promise.all([
      this.state.frontPage !== null && this.renderFrontPage(),
      this.state.tocPrintMode !== "none" && this.renderToc(),
      this.renderContent(),
    ]).then(() => {
      // We're also gonna want to make sure all images has been loaded
      this.areAllImagesLoaded().then(() => {
        // Then we can create an element that will hold our TOC and print-content...
        const printContent = document.createElement("div");
        // Append frontPage
        this.frontPageElement &&
          printContent.appendChild(this.frontPageElement);
        // ...append the TOC to the element (only if applicable)...
        this.toc && printContent.appendChild(this.toc);
        // ...and append the actual content.
        printContent.appendChild(this.content);
        // Then we'll make sure to create page-breaks before headings to
        // create a more appealing document.
        this.addPageBreaksBeforeHeadings(printContent);
        // Then we'll create and open a new window in the browser
        const newWindow = this.createPrintWindow();

        // We're gonna need to get all the styles into the new window...
        // The styling is applied differently if we're in dev- or prod-mode.
        // (Both are handled with this solution). Let's loop every emotion-style-tag
        for (const style of document.querySelectorAll("[data-emotion]")) {
          // Create a new style-tag
          const s = document.createElement("style");
          // Append an empty text-node (TODO: Why? :) )
          s.appendChild(document.createTextNode(""));
          // There's gonna be information in either the style-sheet or in the textContent
          // depending on if we're in dev- or prod-mode.
          const { textContent, sheet } = style;
          // In development we'll have pure text styling the components...
          if (textContent) {
            // In that case we can just append a text-node with that text
            s.appendChild(document.createTextNode(textContent));
            newWindow.document.head.appendChild(s);
            // While in prod, we'll have a stylesheet
          } else {
            // We have to append the new style to the document, otherwise the sheet will be null.
            newWindow.document.head.appendChild(s);
            for (const rule of sheet.cssRules) {
              try {
                s.sheet.insertRule(rule.cssText);
              } catch (error) {
                console.warn(`Could not insert rule: ${rule?.cssText}`);
              }
            }
          }
        }

        // Add our recently-created DIV to the new window's document
        newWindow.document.body.appendChild(printContent);

        // Invoke browser's print dialog - this will block the thread
        // until user does something with it.
        newWindow.print();

        // Once the print dialog has disappeared, let's close the new window
        newWindow.close();

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
    Create a normalized menu structure for the print menu, similar to that of the panel menu, but only for printable documents. 
    */
    const { options } = this.props;

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
        document.tocChapterLevels =
          this.props.options?.tableOfContents?.chapterLevelsToShowForPrint ??
          100;
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

    this.setState({ frontPage: this.createFrontPage(current) }, () => {
      console.log(this.state.frontPage);
    });
  };

  createFrontPage = (documents) => {
    // Here we check if any documents are set to be printed
    const currentDocumentsToPrint = Object.values(documents).filter(
      (doc) => doc.chosenForPrint === true
    );

    if (currentDocumentsToPrint.length !== 0) {
      // Gets frontPageImg from the the first image in the first doc, if an image exists
      const firstDocument = currentDocumentsToPrint.find(
        (doc) => doc.chosenForPrint === true && doc.level === 1
      );
      const tempElement = document.createElement("div");
      tempElement.innerHTML = firstDocument.chapters[0].html;
      const imgElement = tempElement.querySelector("img");
      const frontPageImg = imgElement ? imgElement.getAttribute("src") : null;

      // // Get frontPageTitle from the first document header, handling the case where firstDocumentToPrint might be undefined
      // const frontPageTitle = firstDocumentToPrint
      //   ? firstDocumentToPrint.chapters[0].header
      //   : null;

      // Find the first header and document to print
      const frontPageHeaderTitles = currentDocumentsToPrint
        .filter(
          (header) => header.chosenForPrint === true && header.level === 0
        )
        .map((header) => header.title);

      return {
        titles: frontPageHeaderTitles,
        img: frontPageImg,
        id: 1,
      };
    } else return null;
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

    this.setState({ frontPage: this.createFrontPage(menuState) }, () => {
      console.log(this.state.frontPage);
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
    return (
      <GridFooterContainer
        item
        container
        alignContent="center"
        alignItems="center"
        justifyContent="center"
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
      </GridFooterContainer>
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

  toggleDocumentsAttachments = () => {
    this.setState((prevState) => ({
      showAttachments: !prevState.showAttachments,
    }));
  };

  renderPrintDocuments = () => {
    const { localObserver, documentWindowMaximized } = this.props;
    const { menuInformation } = this.state;
    return (
      <>
        <Typography align="center" variant="h6">
          Skapa PDF
        </Typography>
        <GridSettingsContainer container item>
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
        </GridSettingsContainer>

        <Typography variant="h6">Valt innehåll</Typography>

        <GridMiddleContainer item container>
          <PrintList
            localObserver={localObserver}
            documentMenu={menuInformation}
            level={0}
            handleTogglePrint={this.toggleChosenForPrint}
          />
        </GridMiddleContainer>

        {documentWindowMaximized && this.renderCreatePDFButton()}
        {this.renderLoadingDialog()}
      </>
    );
  };

  openAttachmentModal = (index) => {
    this.setState({
      selectedPdfIndex: index,
      isModalOpen: true,
    });
  };

  closeAttachmentModal = () => {
    this.setState({
      selectedPdfIndex: null,
      isModalOpen: false,
    });
  };

  checkPdfLinks(pdfLinks) {
    const updatedLinks = pdfLinks?.filter(
      (pdfLink) => pdfLink.name || pdfLink.link
    );
    return updatedLinks;
  }

  renderDialog = () => {
    const { isModalOpen, pdfLinks, selectedPdfIndex } = this.state;
    const closeAttachmentModal = this.closeAttachmentModal;

    function ResponsiveDialog() {
      const theme = useTheme();
      const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

      return (
        <Dialog
          fullScreen={fullScreen}
          open={isModalOpen}
          PaperProps={{ style: { width: !fullScreen && "30%" } }}
          BackdropProps={{
            style: { backgroundColor: "rgba(0, 0, 0, 0.25)" },
          }}
          onClose={() => closeAttachmentModal()}
        >
          <StyledDialogContent>
            <StyledIframe
              title={pdfLinks[selectedPdfIndex]?.name}
              src={pdfLinks[selectedPdfIndex]?.link}
            />
          </StyledDialogContent>
          <DialogActions>
            <Button variant="contained" onClick={() => closeAttachmentModal()}>
              <Typography variant="body2">Stäng</Typography>
            </Button>
          </DialogActions>
        </Dialog>
      );
    }
    return (
      <>
        {createPortal(
          <ResponsiveDialog></ResponsiveDialog>,
          document.getElementById("root")
        )}
      </>
    );
  };

  renderPrintAttachments = () => {
    const { pdfLinks, isModalOpen } = this.state;

    const renderAttachment = (pdfLink, index) => {
      const hasName = pdfLink.name !== "";
      const hasLink = pdfLink.link !== "";
      const disabled = !hasLink;
      const name = hasName ? pdfLink.name : "Namn saknas";
      const linkText = hasLink ? "Öppna" : "Länk saknas";
      const linkColor = hasLink ? "primary" : "text.secondary";
      const linkIcon = hasLink ? (
        <OpenInNewIcon sx={{ width: "15px" }} />
      ) : null;

      return (
        <div key={index}>
          <StyledListItemButton
            disabled={disabled}
            index={index}
            onClick={() => this.openAttachmentModal(index)}
          >
            <Typography
              sx={{
                fontStyle: !hasName ? "italic" : "inherit",
                color: !hasName ? "gray" : "inherit",
              }}
            >
              {name}
            </Typography>
            {hasLink && (
              <Button
                href={pdfLink.link}
                target="_blank"
                sx={{ height: "28px", padding: "10px", minWidth: "auto" }}
                color={linkColor}
                variant="contained"
                startIcon={linkIcon}
                onClick={(event) => event.stopPropagation()}
              >
                <Typography variant="body2" justify="center">
                  {linkText}
                </Typography>
              </Button>
            )}
            {!hasLink && (
              <Typography sx={{ fontStyle: "italic" }}>Länk saknas</Typography>
            )}
          </StyledListItemButton>
        </div>
      );
    };

    return (
      <>
        <Typography align="center" variant="h6">
          Bilagor
        </Typography>
        <Typography variant="h6">Innehåll</Typography>
        <GridMiddleContainer>
          <List>{pdfLinks.map(renderAttachment)}</List>
        </GridMiddleContainer>
        {isModalOpen && this.renderDialog()}
      </>
    );
  };

  render() {
    const { togglePrintWindow } = this.props;
    const { showAttachments, pdfLinks } = this.state;

    return (
      <>
        {!showAttachments ? (
          <GridGridContainer container wrap="nowrap" direction="column">
            <GridHeaderContainer
              alignItems="center"
              justifyContent="space-between"
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
              <StyledGrid item xs={4}>
                {pdfLinks?.length > 0 && (
                  <Button
                    color="primary"
                    style={{ paddingLeft: 0 }}
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => this.toggleDocumentsAttachments()}
                  >
                    <Typography justify="center">Bilagor</Typography>
                  </Button>
                )}
              </StyledGrid>
            </GridHeaderContainer>
            {this.renderPrintDocuments()}
          </GridGridContainer>
        ) : (
          <GridGridContainer container wrap="nowrap" direction="column">
            <GridHeaderContainer
              alignItems="center"
              justifyContent="space-between"
              item
              container
            >
              <Grid item xs={4}>
                <Button
                  color="primary"
                  style={{ paddingLeft: 0 }}
                  startIcon={<ArrowBackIcon />}
                  onClick={() => this.toggleDocumentsAttachments()}
                >
                  <Typography justify="center">Skapa Pdf</Typography>
                </Button>
              </Grid>
            </GridHeaderContainer>
            {this.renderPrintAttachments()}
          </GridGridContainer>
        )}
      </>
    );
  }
}

export default withSnackbar(PrintWindow);
