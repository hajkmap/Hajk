import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import { Typography } from "@material-ui/core";
import Fab from "@material-ui/core/Fab";
import NavigationIcon from "@material-ui/icons/Navigation";
import Grid from "@material-ui/core/Grid";

const styles = theme => ({
  gridContainer: {
    height: "100%"
  },
  test: {
    overflow: "scroll"
  }
});

class DocumentViewer extends React.PureComponent {
  state = {};

  static propTypes = {};

  static defaultProps = {};

  constructor(props) {
    super(props);
    this.myRef = React.createRef();
    this.model = this.props.model;
    this.localObserver = this.props.localObserver;
    this.globalObserver = this.props.app.globalObserver;
    console.log(this.props, "myRef");
  }

  scrollToTop = () => {};

  render() {
    const { classes, baseWindow } = this.props;
    console.log(baseWindow, "baseWindow");
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
            <Typography>
              dsadsadasdsadsadasdsadsadasdsadsad
              adasdsadsadasdsadsadasdsadsadasds
              asdsadsadasdsadsadasdsadsadasdsadsds
              adsadasdsadsadasdsadsadasdsadsadasdsadasdsa
              dsadasdsadsadasdsadsadasdsadsadasdsads
              dsadsadasdsadsadasdsadsadasdsadsadasdsdasdsadsadasds
              adsadasdsadsadasdsadsadasdsadsadasdsaddsadas
              dsadsadasdsadsadasdsadsadasdsadsadasdsads
              adsadasdsadsadasdsadsadasdsadsadasdsaddsadas
              dsadsadasdsadsadasdsadsadasdsadsadasdsads
              adsadasdsadsadasdsadsadasdsadsadasdsaddsadas
              dsadsadasdsadsadasdsadsadasdsadsadasdsads
              adsadasdsadsadasdsadsadasdsadsadasdsaddsadas
              dsadsadasdsadsadasdsadsadasdsadsadasdsads
              adsadasdsadsadasdsadsadasdsadsadasdsaddsadas
              dsadsadasdsadsadasdsadsadasdsadsadasdsads
              adsadasdsadsadasdsadsadasdsadsadasdsaddsadas
              dsadsadasdsadsadasdsadsadasdsadsadasdsads
              adsadasdsadsadasdsadsadasdsadsadasdsaddsadas
              dsadsadasdsadsadasdsadsadasdsadsadasdsads
              adsadasdsadsadasdsadsadasdsadsadasdsaddsadas
              dsadsadasdsadsadasdsadsadasdsadsadasdsads
              adsadasdsadsadasdsadsadasdsadsadasdsaddsadas
              dsadsadasdsadsadasdsadsadasdsadsadasdsads
              adsadasdsadsadasdsadsadasdsadsadasdsaddsadas
              dsadsadasdsadsadasdsadsadasdsadsadasdsads
              adsadasdsadsadasdsadsadasdsadsadasdsaddsadas
              dsadsadasdsadsadasdsadsadasdsadsadasdsads
              adsadasdsadsadasdsadsadasdsadsadasdsaddsadas
              dsadsadasdsadsadasdsadsadasdsadsadasdsads
              adsadasdsadsadasdsadsadasdsadsadasdsaddsadas
              dsadsadasdsadsadasdsadsadasdsadsadasdsads
              adsadasdsadsadasdsadsadasdsadsadasdsaddsadas
              dsadsadasdsadsadasdsadsadasdsadsadasdsads
              adsadasdsadsadasdsadsadasdsadsadasdsaddsadas
              dsadsadasdsadsadasdsadsadasdsadsadasdsads
              adsadasdsadsadasdsadsadasdsadsadasdsaddsadas
              dsadsadasdsadsadasdsadsadasdsadsadasdsads
              adsadasdsadsadasdsadsadasdsadsadasdsaddsadas
              dsadsadasdsadsadasdsadsadasdsadsadasdsads
              adsadasdsadsadasdsadsadasdsadsadasdsaddsadas
              dsadsadasdsadsadasdsadsadasdsadsadasdsads
              adsadasdsadsadasdsadsadasdsadsadasdsaddsadas
              dsadsadasdsadsadasdsadsadasdsadsadasdsads
              adsadasdsadsadasdsadsadasdsadsadasdsaddsadas
              dsadsadasdsadsadasdsadsadasdsadsadasdsads
              adsadasdsadsadasdsadsadasdsadsadasdsaddsadas
              dsadsadasdsadsadasdsadsadasdsadsadasdsads
              adsadasdsadsadasdsadsadasdsadsadasdsaddsadas
              dsadsadasdsadsadasdsadsadasdsadsadasdsads
              adsadasdsadsadasdsadsadasdsadsadasdsaddsadas
              dsadsadasdsadsadasdsadsadasdsadsadasdsads
              adsadasdsadsadasdsadsadasdsadsadasdsaddsadas
              dsadsadasdsadsadasdsadsadasdsadsadasdsads
              adsadasdsadsadasdsadsadasdsadsadasdsaddsadas
              dsadsadasdsadsadasdsadsadasdsadsadasdsads
              adsadasdsadsadasdsadsadasdsadsadasdsaddsadas
              dsadsadasdsadsadasdsadsadasdsadsadasdsads
              adsadasdsadsadasdsadsadasdsadsadasdsaddsadas
              dsadsadasdsadsadasdsadsadasdsadsadasdsads
            </Typography>
          </Grid>
        </Grid>
      </>
    );
  }
}

export default withStyles(styles)(withSnackbar(DocumentViewer));
