import React from "react";
import { styled } from "@mui/material/styles";

import Grid from "@mui/material/Grid";
import TableOfContents from "./TableOfContents";
import Contents from "./Contents";
import { delay } from "../../../utils/Delay";
import { isMobile } from "../../../utils/IsMobile";
import { animateScroll as scroll } from "react-scroll";
import ScrollToTop from "./ScrollToTop";
import { configText } from "src/i18n";

const GridContainer = styled(Grid)(({ theme }) => ({
  maxHeight: "100%",
  overflowY: "auto",
  overflowX: "hidden",
  userSelect: "text",
  outline: "none",
  // 38px clears the fixed scroll-to-top button. It stays on above xs even
  // when that button is hidden (short documents, minimized window). xs uses
  // 10px because the button is not shown there.
  paddingBottom: "38px",
  [theme.breakpoints.only("xs")]: {
    paddingBottom: "10px",
  },
}));

const ContentContainer = styled(Grid)(({ theme }) => ({
  paddingBottom: theme.spacing(1),
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
  outline: "none",
  [theme.breakpoints.only("xs")]: {
    paddingLeft: 0,
    paddingRight: 0,
  },
}));

const TocGridWrapper = styled(Grid)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

const expandedTocOnStart = (props) => {
  const { activeDocument, options } = props;
  const mapConfigSetting = options?.tableOfContents?.expanded;
  const documentSetting = activeDocument?.tableOfContents?.expanded;
  if (documentSetting || documentSetting === false) {
    return documentSetting;
  }
  if (mapConfigSetting || mapConfigSetting === false) {
    return mapConfigSetting;
  }
  return true;
};

class DocumentViewer extends React.PureComponent {
  state = {
    showScrollButton: false,
    showPrintWindow: false,
    expandedTableOfContents: expandedTocOnStart(this.props),
  };

  constructor(props) {
    super(props);
    this.documentViewerRef = React.createRef();
    this.setScrollButtonLimit();
    this.bindSubscriptions();
  }

  setScrollButtonLimit = () => {
    const { options } = this.props;
    let showScrollButtonLimit = options.showScrollButtonLimit;
    this.scrollLimit =
      showScrollButtonLimit != null && showScrollButtonLimit !== ""
        ? showScrollButtonLimit
        : 400;
  };

  bindSubscriptions = () => {
    const { localObserver } = this.props;

    localObserver.subscribe("scroll-to-chapter", async (chapter) => {
      /* Delay so the chapter ref exists after a document switch.
         Set scrollTop on the scrollport — scrollIntoView also moves
         ancestor windows (react-rnd transform) and misaligns the header. */
      await delay(100);
      this.scrollChapterIntoView(chapter);
    });

    localObserver.subscribe("scroll-to-top", () => {
      this.scrollToTop();
    });
  };

  onScroll = (e) => {
    if (e.target.scrollTop > this.scrollLimit) {
      this.setState({
        showScrollButton: true,
      });
    } else {
      this.setState({
        showScrollButton: false,
      });
    }
  };

  componentDidUpdate = (prevProps) => {
    if (prevProps.activeDocument !== this.props.activeDocument) {
      this.setState({
        expandedTableOfContents: expandedTocOnStart(this.props),
      });
    }
  };

  // Same isMobile flag that picks Window vs WindowSheet. Desktop scrolls
  // #documentViewer. Mobile scrolls the sheet, because the viewer grows
  // with the document and is not the scrollport there. The scroller is the
  // parent of .window-sheet-content, same as WindowSheet's scroll ref.
  scrollContainer = () => {
    const viewer = this.documentViewerRef.current;
    if (!viewer) return null;
    if (!isMobile) return viewer;
    return viewer.closest(".window-sheet-content")?.parentElement ?? null;
  };

  scrollChapterIntoView = (chapter) => {
    const target = chapter?.scrollRef?.current;
    const container = this.scrollContainer();
    if (!target || !container) return;

    // Any focused element in the sheet makes mobile browsers scroll that
    // element back into view after the chapter jump. Contents rows and
    // in-document chapter links both do this.
    if (isMobile) {
      const active = document.activeElement;
      if (active instanceof HTMLElement && container.contains(active)) {
        active.blur();
      }
    }

    const align = () => {
      container.scrollTop +=
        target.getBoundingClientRect().top -
        container.getBoundingClientRect().top;
    };

    align();
    if (isMobile) requestAnimationFrame(align);
  };

  scrollToTop = async () => {
    scroll.scrollTo(0, {
      containerId: "documentViewer",
      smooth: false,
      duration: 0,
      delay: 100,
    });
  };

  selectAllText = () => {
    let range = document.createRange();
    range.selectNode(this.documentViewerRef.current);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
  };

  toggleCollapse = (_e) => {
    this.setState({
      expandedTableOfContents: !this.state.expandedTableOfContents,
    });
  };

  getTocTitle = () => {
    const { activeDocument, options } = this.props;
    const documentSettingTitle = activeDocument?.tableOfContents?.title;
    const mapConfigSettingTitle = options?.tableOfContents?.title;

    // false hides the title. Otherwise it's admin text, see configText().
    const adminTitle =
      documentSettingTitle || documentSettingTitle === false
        ? documentSettingTitle
        : mapConfigSettingTitle;
    if (adminTitle === false) {
      return false;
    }
    return configText("documentHandler.tableOfContents", adminTitle);
  };

  getChapterLevelsToShowInToc = () => {
    const { activeDocument, options } = this.props;

    const documentSettingLevels =
      activeDocument?.tableOfContents?.chapterLevelsToShow;
    const mapConfigSettingLevels =
      options?.tableOfContents?.chapterLevelsToShow;

    if (documentSettingLevels) {
      return documentSettingLevels;
    }
    if (mapConfigSettingLevels) {
      return mapConfigSettingLevels;
    }

    return 100;
  };

  getShouldShowTableOfContents = () => {
    const { activeDocument, options } = this.props;

    const documentSetting = activeDocument?.tableOfContents?.active;
    const mapConfigSetting = options?.tableOfContents?.active;

    if (documentSetting || documentSetting === false) {
      return documentSetting;
    }
    if (mapConfigSetting || mapConfigSetting === false) {
      return mapConfigSetting;
    }
    return true;
  };

  getTableOfContents = () => {
    const { expandedTableOfContents } = this.state;
    const { activeDocument, localObserver } = this.props;

    const title = this.getTocTitle();
    const chapterLevelsToShow = this.getChapterLevelsToShowInToc();
    return (
      <TableOfContents
        localObserver={localObserver}
        toggleCollapse={this.toggleCollapse}
        activeDocument={activeDocument}
        expanded={expandedTableOfContents}
        title={title}
        chapterLevelsToShow={chapterLevelsToShow}
      />
    );
  };

  render() {
    const {
      activeDocument,
      localObserver,
      documentWindowMaximized,
      model,
      options,
    } = this.props;

    const { showScrollButton } = this.state;
    const showTableOfContents = this.getShouldShowTableOfContents();
    return (
      <>
        <GridContainer
          onScroll={this.onScroll}
          id="documentViewer"
          ref={this.documentViewerRef}
          container
        >
          {showTableOfContents && (
            <TocGridWrapper size={12}>
              {this.getTableOfContents()}
            </TocGridWrapper>
          )}

          <ContentContainer
            id="documentViewerContentContainer"
            tabIndex="0" //Focus grid to be able to use onKeyDown
            onKeyDown={(e) => {
              //If ctrl-a or command-a is pressed
              if ((e.ctrlKey || e.metaKey) && e.keyCode === 65) {
                this.selectAllText();
                e.preventDefault();
              }
            }}
            sx={[
              showTableOfContents
                ? {
                    marginTop: 0,
                  }
                : {
                    marginTop: 2,
                  },
            ]}
            container
          >
            <Contents
              options={options}
              model={model}
              localObserver={localObserver}
              activeDocument={activeDocument}
            />
          </ContentContainer>
        </GridContainer>
        {showScrollButton && documentWindowMaximized && (
          <ScrollToTop
            color={activeDocument.documentColor}
            onClick={this.scrollToTop}
          ></ScrollToTop>
        )}
      </>
    );
  }
}

export default DocumentViewer;
