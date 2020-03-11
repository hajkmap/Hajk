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
  state = {};

  static propTypes = {};

  static defaultProps = {};

  constructor(props) {
    super(props);
    this.model = this.props.model;
    this.localObserver = this.props.localObserver;
    this.globalObserver = this.props.app.globalObserver;
  }

  scrollToTop = () => {
    this.globalObserver.publish("scrollDocumentviewer");
  };

  render() {
    const { classes, activeDocument } = this.props;
    return (
      <>
        <Grid className={classes.gridContainer} container>
          <Fab
            style={{ position: "fixed", bottom: 10, right: 10 }}
            size="small"
            color="primary"
            aria-label="goto-top"
            onClick={this.scrollToTop}
          >
            <NavigationIcon />
          </Fab>
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
