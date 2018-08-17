import React, { Component } from "react";
import Observer from "react-event-observer";
import GeolocationModel from "./model.js";
import { createPortal } from "react-dom";
import { transform } from "ol/proj";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import { Vector as VectorSource } from "ol/source.js";
import { Vector as VectorLayer } from "ol/layer.js";
import "./style.css";

import PropTypes from "prop-types";
import classNames from "classnames";
import { withStyles } from "@material-ui/core/styles";
import CircularProgress from "@material-ui/core/CircularProgress";
import green from "@material-ui/core/colors/green";
import Button from "@material-ui/core/Button";
import CheckIcon from "@material-ui/icons/Check";
import NavigationIcon from "@material-ui/icons/Navigation";

const styles = theme => ({
  root: {
    display: "flex",
    alignItems: "center",
    top: "235px",
    right: "15px",
    position: "absolute"
  },
  wrapper: {
    margin: theme.spacing.unit,
    position: "relative"
  },
  buttonSuccess: {
    backgroundColor: green[500],
    "&:hover": {
      backgroundColor: green[700]
    }
  },
  fabProgress: {
    color: green[500],
    position: "absolute",
    top: -6,
    left: -6,
    zIndex: 1
  },
  buttonProgress: {
    color: green[500],
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -12,
    marginLeft: -12
  }
});
class Geolocation extends Component {
  constructor() {
    super();
    this.state = {
      toggled: false,
      // currentCoords: null
      loading: false,
      success: false
    };
  }

  /* TODO:
   * Make the "here you are" dot looks nicer.
   * Add listener this.on('change:location', () => { this.setLocation(); }) and update dot's location
   * Don't render that nasty <span> to #toolbar!
   * */

  componentDidMount() {
    this.observer = Observer();
    this.observer.subscribe("myEvent", message => {
      console.log(message);
    });
    this.GeolocationModel = new GeolocationModel({
      map: this.props.tool.map,
      app: this.props.tool.app,
      observer: this.observer
    });
    this.props.tool.instance = this;
    this.map = this.props.tool.map;

    // Init geolocation layer where the point will be drawn to
    this.source = new VectorSource({ wrapX: false });
    this.layer = new VectorLayer({
      source: this.source,
      name: "geolocation-layer"
    });
    this.map.addLayer(this.layer);
  }

  drawPoint = coords => {
    this.layer.getSource().clear();
    let point = new Point(coords);
    this.layer.getSource().addFeature(
      new Feature({
        geometry: point
      })
    );
  };

  geolocationSuccess = pos => {
    const transformed = transform(
      [pos.coords.longitude, pos.coords.latitude],
      "EPSG:4326",
      this.map.getView().getProjection()
    );
    // this.setState({ currentCoords: transformed });
    this.drawPoint(transformed);
    this.setState({ loading: false, success: true });
    this.map.getView().animate({ center: transformed, zoom: 10 });
  };

  geolocationError = err => {
    console.error(err);
    this.setState({ loading: false, success: false });
  };

  handleClick = () => {
    // this.btn.setAttribute("disabled", "disabled");
    if (!this.state.loading) {
      this.setState(
        {
          loading: true,
          success: false
        },
        () => {
          navigator.geolocation.getCurrentPosition(
            this.geolocationSuccess,
            this.geolocationError
          );
        }
      );
    }

    // this.btn.removeAttribute("disabled");
  };

  render() {
    const { loading, success } = this.state;
    const { classes } = this.props;
    const buttonClassname = classNames({
      [classes.buttonSuccess]: success
    });
    return (
      <span>
        {createPortal(
          <div>
            <div className={classes.root}>
              <div className={classes.wrapper}>
                <Button
                  variant="fab"
                  color="primary"
                  className={buttonClassname}
                  onClick={this.handleClick}
                >
                  {success ? <CheckIcon /> : <NavigationIcon />}
                </Button>
                {loading && (
                  <CircularProgress size={68} className={classes.fabProgress} />
                )}
              </div>
            </div>

            {/* <div className="ol-control ol-geolocation">
              <button
                type="button"
                title="Zooma till min nuvarande position"
                ref={btn => {
                  this.btn = btn; // expose a ref btn can be reached from handleClick and disabled/enabled
                }}
                onClick={this.handleClick}
              >
                <i className="material-icons">navigation</i>
              </button>
            </div> */}
          </div>,
          document.getElementById("map")
        )}
      </span>
    );
  }
}

Geolocation.propTypes = {
  classes: PropTypes.object.isRequired
};

// export default Geolocation;
export default withStyles(styles)(Geolocation);
