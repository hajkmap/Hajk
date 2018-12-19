import React from "react";
import { withStyles } from "@material-ui/core/styles";
import PropTypes from "prop-types";
import { withSnackbar } from "notistack";
import Typography from "@material-ui/core/Typography";

const styles = theme => ({
  streetViewWindow: {
    height: "250px"
  },
  hidden: {
    display: "none"
  }
});

class StreetViewView extends React.PureComponent {
  state = {};

  constructor(props) {
    super(props);
    this.model = this.props.model;
    this.app = this.props.app;
    this.localObserver = this.props.localObserver;
  }

  componentDidMount() {
    this.localObserver.on("changeImageDate", imageDate => {
      this.setState({
        imageDate: imageDate
      });
    });
  }

  componentWillUnmount() {
    this.props.model.deactivate();
  }

  renderInfoText() {
    if (!this.props.displayPanorama) {
      return (
        <Typography>
          Klicka i kartan för att aktivera street view. <br />
          Förstora fönstret genom att trycka på symbolen i övre högra hörnet.
        </Typography>
      );
    }
  }

  render() {
    const { classes } = this.props;
    return (
      <>
        <div>
          {this.renderInfoText()}
          <div className={this.props.displayPanorama ? null : classes.hidden}>
            <div id="street-view-window" className={classes.streetViewWindow} />
            <div id="image-date">
              {this.state.imageDate ? this.state.imageDate : ""}
            </div>
          </div>
        </div>
      </>
    );
  }
}

StreetViewView.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(withSnackbar(StreetViewView));
