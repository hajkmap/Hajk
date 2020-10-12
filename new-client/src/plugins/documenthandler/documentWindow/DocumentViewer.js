import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import Fab from "@material-ui/core/Fab";
import NavigationIcon from "@material-ui/icons/Navigation";
import Grid from "@material-ui/core/Grid";
import TableOfContents from "./TableOfContents";
import Contents from "./Contents";
import { Typography } from "@material-ui/core";
import Button from "@material-ui/core/Button";
import PrintIcon from "@material-ui/icons/Print";

const styles = (theme) => ({
  gridContainer: {
    height: "100%",
    padding: theme.spacing(3),
    overflowY: "scroll",
    overflowX: "hidden",
    userSelect: "text",
  },
  scrollToTopButton: {
    position: "fixed",
    bottom: theme.spacing(2),
    right: theme.spacing(3),
  },
  printButton: {
    paddingBottom: theme.spacing(1),
  },
});

class DocumentViewer extends React.PureComponent {
  state = {
    showScrollButton: false,
    showPrintWindow: false,
  };

  constructor(props) {
    super(props);
    this.scrollElementRef = React.createRef();
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

    localObserver.subscribe("scroll-to-chapter", (chapter) => {
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
      this.scrollToTop();
    }
  };

  scrollToTop = () => {
    this.scrollElementRef.current.scrollTop = 0;
  };

  renderScrollToTopButton = () => {
    const { classes } = this.props;
    return (
      <Fab
        className={classes.scrollToTopButton}
        size="small"
        color="primary"
        onClick={this.scrollToTop}
      >
        <Typography variant="srOnly">
          Scrolla till toppen av dokumentet
        </Typography>
        <NavigationIcon />
      </Fab>
    );
  };

  selectAllText = () => {
    let range = document.createRange();
    range.selectNode(this.scrollElementRef.current);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
  };

  render() {
    const {
      classes,
      activeDocument,
      localObserver,
      documentWindowMaximized,
      model,
      documentColor,
      togglePrintWindow,
      options,
    } = this.props;

    const { showScrollButton } = this.state;
    return (
      <>
        <Grid
          tabIndex="0" //Focus grid to be able to use onKeyDown
          onKeyDown={(e) => {
            //If ctrl-a or command-a is pressed
            if ((e.ctrlKey || e.metaKey) && e.keyCode === 65) {
              this.selectAllText();
              e.preventDefault();
            }
          }}
          onScroll={this.onScroll}
          ref={this.scrollElementRef}
          className={classes.gridContainer}
          container
        >
          <Grid
            xs={12}
            container
            item
            justify="flex-end"
            className={classes.printButton}
          >
            <Button
              variant="outlined"
              color="primary"
              style={{ maxHeight: "35px" }}
              startIcon={<PrintIcon />}
              disabled={options.enablePrint ? !options.enablePrint : true}
              onClick={togglePrintWindow}
            >
              <Typography>Skapa PDF</Typography>
            </Button>
          </Grid>
          <Grid xs={12} item>
            <TableOfContents
              documentColor={documentColor}
              localObserver={localObserver}
              activeDocument={activeDocument}
            />
          </Grid>
          <Grid container item>
            <Contents
              model={model}
              localObserver={localObserver}
              activeDocument={activeDocument}
            />
          </Grid>
        </Grid>
        {showScrollButton &&
          documentWindowMaximized &&
          this.renderScrollToTopButton()}
      </>
    );
  }
}

export default withStyles(styles)(withSnackbar(DocumentViewer));
