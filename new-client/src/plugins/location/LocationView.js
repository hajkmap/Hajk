import React from "react";
import { withStyles } from "@material-ui/core/styles";
import PropTypes from "prop-types";

import { withSnackbar } from "notistack";

import Geolocation from "ol/Geolocation.js";
import Feature from "ol/Feature.js";
import Point from "ol/geom/Point.js";
import { Vector as VectorLayer } from "ol/layer.js";
import { Vector as VectorSource } from "ol/source.js";
import { Circle as CircleStyle, Fill, Stroke, Style } from "ol/style.js";

import FormGroup from "@material-ui/core/FormGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Switch from "@material-ui/core/Switch";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Paper from "@material-ui/core/Paper";
import LinearProgress from "@material-ui/core/LinearProgress";

const styles = theme => ({});

class LocationView extends React.PureComponent {
  firstLoad = true; // used to determine if we want to center and zoom in to point (we want this only on first position change)

  state = {
    errorMessage: null,
    loading: false, // indicates if loading is in progress
    track: false, // enables or disables GPS tracking
    accuracy: undefined, // this and the following actual GPS info values
    altitude: undefined,
    altitudeAccuracy: undefined,
    heading: undefined,
    speed: undefined
  };

  locationDetails = {
    accuracy: { id: 0, label: "Precision (m)" },
    altitude: { id: 1, label: "Höjd (m. ö. h.)" },
    altitudeAccuracy: { id: 2, label: "Höjdprecision (m)" },
    heading: { id: 3, label: "Riktning (rad)" },
    speed: { id: 4, label: "Hastighet (m/s)" }
  };

  componentDidMount() {
    this.map = this.props.map;

    // Create source and layer and add to map. Later on we'll draw features to this layer.
    this.source = new VectorSource({ wrapX: false });
    this.layer = new VectorLayer({
      source: this.source,
      name: "geolocation-layer"
    });
    this.map.addLayer(this.layer);

    // Create 2 features, one for position (point) and another one for position accuracy (outer ring)
    this.accuracyFeature = new Feature();
    this.positionFeature = new Feature();
    this.positionFeature.setStyle(
      new Style({
        image: new CircleStyle({
          radius: 6,
          fill: new Fill({
            color: "#3399CC"
          }),
          stroke: new Stroke({
            color: "#fff",
            width: 2
          })
        })
      })
    );

    // Init geolocation layer where the point will be drawn to
    this.geolocation = new Geolocation({
      trackingOptions: {
        enableHighAccuracy: true
      },
      projection: this.map.getView().getProjection()
    });

    // Set up some event handlers for our Geolocation object
    this.geolocation.on("change", this.handleGeolocationChange);
    this.geolocation.on("error", this.handleGeolocationError);
    this.geolocation.on(
      "change:accuracyGeometry",
      this.handleGeolocationChangeAccuracy
    );
    this.geolocation.on(
      "change:position",
      this.handleGeolocationChangePosition
    );
  }

  handleGeolocationChange = () => {
    this.setState({
      accuracy: this.geolocation.getAccuracy(),
      altitude: this.geolocation.getAltitude(),
      altitudeAccuracy: this.geolocation.getAltitudeAccuracy(),
      heading: this.geolocation.getHeading(),
      speed: this.geolocation.getSpeed()
    });
  };

  handleGeolocationError = error => {
    this.setState({ loading: false });
    console.log("error: ", error);
    this.props.enqueueSnackbar(
      `Kunde inte fastställa din plats. Felkod: ${error.code}. Detaljer: "${error.message}".`,
      {
        variant: "error"
      }
    );
  };

  handleGeolocationChangeAccuracy = () => {
    this.accuracyFeature.setGeometry(this.geolocation.getAccuracyGeometry());
  };

  handleGeolocationChangePosition = () => {
    let coordinates = this.geolocation.getPosition();
    this.positionFeature.setGeometry(
      coordinates ? new Point(coordinates) : null
    );

    // If we've got new coordinates, make sure to hide the loading indicator
    if (this.state.loading) {
      this.setState({ loading: false });
    }

    if (this.firstLoad) {
      this.map.getView().animate({ center: coordinates, zoom: 10 });
      this.firstLoad = false;
    }
  };

  toggleTracking = event => {
    this.setState({ track: event.target.checked });
    this.setState({ loading: event.target.checked });
    this.geolocation.setTracking(event.target.checked);

    // Remove features from map if tracking has been switched off
    if (event.target.checked === false) {
      this.layer.getSource().clear();
    }
    // Else, add 2 features to map, one for accuracy (outer ring) and one for position (smaller point)
    else {
      this.layer.getSource().addFeature(this.accuracyFeature);
      this.layer.getSource().addFeature(this.positionFeature);
    }
  };

  renderLocationDetails() {
    if (this.state.track === false) {
      return null;
    } else {
      return (
        <Paper>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Egenskap</TableCell>
                <TableCell align="right">Värde</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.keys(this.locationDetails).map(row => {
                let r = this.locationDetails[row];
                return (
                  <TableRow key={r.id}>
                    <TableCell component="th" scope="row">
                      {r.label}
                    </TableCell>
                    <TableCell align="right">
                      {this.state[row] ? this.state[row] : "–"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Paper>
      );
    }
  }

  render() {
    return (
      <>
        <FormGroup row>
          <FormControlLabel
            control={
              <Switch
                checked={this.state.track}
                onChange={this.toggleTracking}
                value="track"
              />
            }
            label="Visa min position"
          />
        </FormGroup>
        {this.state.loading && <LinearProgress />}
        {this.renderLocationDetails()}
      </>
    );
  }
}

LocationView.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(withSnackbar(LocationView));
