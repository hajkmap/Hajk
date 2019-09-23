import React from "react";
import { withStyles } from "@material-ui/core/styles";
import PropTypes from "prop-types";
import { withSnackbar } from "notistack";
import Typography from "@material-ui/core/Typography";

const styles = theme => ({
  streetViewWindow: {
    flex: 1,
    position: "absolute !important",
    top: "42px",
    bottom: 0,
    left: 0,
    right: 0
  },
  panorama: {
    display: "flex"
  },
  hidden: {
    display: "none"
  },
  streetView: {
    marginTop: "30px"
  },
  date: {
    color: "white",
    position: "absolute",
    zIndex: 1,
    top: "42px",
    left: 0,
    background: "rgba(0, 0, 0, 0.7)",
    padding: "0px 3px",
    lineHeight: 1.4,
    fontSize: "10px"
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
    this.localObserver.subscribe("changeImageDate", imageDate => {
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
      <div className={classes.streetView}>
        {this.renderInfoText()}
        <div
          className={
            this.props.displayPanorama ? classes.panorama : classes.hidden
          }
        >
          <div id="street-view-window" className={classes.streetViewWindow} />
          <div id="image-date" className={classes.date}>
            {this.state.imageDate ? this.state.imageDate : ""}
          </div>
        </div>
      </div>
    );
  }
}

StreetViewView.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(withSnackbar(StreetViewView));
