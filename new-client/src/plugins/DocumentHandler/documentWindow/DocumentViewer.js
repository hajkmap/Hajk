import React from "react";
import { withStyles } from "@material-ui/core/styles";

import Grid from "@material-ui/core/Grid";
import TableOfContents from "./TableOfContents";
import clsx from "clsx";
import Contents from "./Contents";
import { delay } from "../../../utils/Delay";
import { animateScroll as scroll } from "react-scroll";
import ScrollToTop from "./ScrollToTop";

const styles = (theme) => ({
  gridContainer: {
    maxHeight: "100%",
    overflowY: "auto",
    overflowX: "hidden",
    userSelect: "text",
    outline: "none",
  },
  contentContainer: {
    paddingBottom: theme.spacing(1),
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    outline: "none",
  },
  margin: {
    marginTop: theme.spacing(2),
  },

  toc: {
    marginBottom: theme.spacing(2),
  },
  printButton: {
    paddingBottom: theme.spacing(1),
  },
});

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
      /*scrollIntoView is buggy without dirty fix - 
      tried using react life cycle methods but is, for some reason, not working*/
      await delay(100);
      chapter.scrollRef.current.scrollIntoView();
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

  toggleCollapse = (e) => {
    this.setState({
      expandedTableOfContents: !this.state.expandedTableOfContents,
    });
  };

  getTocTitle = () => {
    const { activeDocument, options } = this.props;
    const documentSettingTitle = activeDocument?.tableOfContents?.title;
    const mapConfigSettingTitle = options?.tableOfContents?.title;

    if (documentSettingTitle || documentSettingTitle === false) {
      return documentSettingTitle;
    }
    if (mapConfigSettingTitle || mapConfigSettingTitle === false) {
      return mapConfigSettingTitle;
    }
    return "Innehållsförteckning";
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
      classes,
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
        <Grid
          onScroll={this.onScroll}
          id="documentViewer"
          ref={this.documentViewerRef}
          className={classes.gridContainer}
          container
        >
          {showTableOfContents && (
            <Grid className={classes.toc} xs={12} item>
              {this.getTableOfContents()}
            </Grid>
          )}

          <Grid
            tabIndex="0" //Focus grid to be able to use onKeyDown
            onKeyDown={(e) => {
              //If ctrl-a or command-a is pressed
              if ((e.ctrlKey || e.metaKey) && e.keyCode === 65) {
                this.selectAllText();
                e.preventDefault();
              }
            }}
            className={clsx(
              showTableOfContents
                ? classes.contentContainer
                : [classes.contentContainer, classes.margin]
            )}
            container
            item
          >
            <Contents
              options={options}
              model={model}
              localObserver={localObserver}
              activeDocument={activeDocument}
            />
          </Grid>
        </Grid>
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

export default withStyles(styles)(DocumentViewer);
