import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import Fab from "@material-ui/core/Fab";
import NavigationIcon from "@material-ui/icons/Navigation";
import Grid from "@material-ui/core/Grid";
import TableOfContents from "./TableOfContents";
import Contents from "./Contents";

const styles = theme => ({
  gridContainer: {
    height: "100%",
    overflowY: "scroll"
  }
});

class DocumentViewer extends React.PureComponent {
  state = {
    showScrollButton: false
  };

  static propTypes = {};

  static defaultProps = {};

  constructor(props) {
    super(props);
    let showScrollButtonLimit = props.options.showScrollButtonLimit;
    this.model = props.model;
    this.localObserver = props.localObserver;
    this.globalObserver = props.app.globalObserver;
    this.scrollLimit =
      showScrollButtonLimit != null && showScrollButtonLimit !== ""
        ? showScrollButtonLimit
        : 400;
    this.scrollElementRef = React.createRef();
  }

  onScroll = e => {
    if (e.target.scrollTop > this.scrollLimit) {
      this.setState({
        showScrollButton: true
      });
    } else {
      this.setState({
        showScrollButton: false
      });
    }
  };

  scrollToTop = () => {
    this.scrollElementRef.current.scrollTo(0, 0);
  };

  render() {
    const { classes, activeDocument } = this.props;
    const { showScrollButton } = this.state;
    return (
      <>
        <Grid
          onScroll={this.onScroll}
          ref={this.scrollElementRef}
          className={classes.gridContainer}
          container
        >
          {showScrollButton && (
            <Fab
              style={{ position: "fixed", bottom: 10, right: 10 }}
              size="small"
              color="primary"
              aria-label="goto-top"
              onClick={this.scrollToTop}
            >
              <NavigationIcon />
            </Fab>
          )}
          <Grid item>
            <TableOfContents document={activeDocument} />
            <Contents document={activeDocument} />
          </Grid>
        </Grid>
      </>
    );
  }
}

export default withStyles(styles)(withSnackbar(DocumentViewer));
