import React from "react";
import { withStyles } from "@material-ui/core/styles";
import PropTypes from "prop-types";

import { withSnackbar } from "notistack";

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

const styles = (theme) => ({});

class LocationView extends React.PureComponent {
  state = {
    loading: false, // indicates if loading is in progress
    track: false, // enables or disables GPS tracking
    accuracy: undefined, // this and the following actual GPS info values
    altitude: undefined,
    altitudeAccuracy: undefined,
    heading: undefined,
    speed: undefined,
  };

  locationDetails = {
    accuracy: { id: 0, label: "Precision (m)" },
    altitude: { id: 1, label: "Höjd (m. ö. h.)" },
    altitudeAccuracy: { id: 2, label: "Höjdprecision (m)" },
    heading: { id: 3, label: "Riktning (rad)" },
    speed: { id: 4, label: "Hastighet (m/s)" },
  };

  componentDidMount() {
    this.map = this.props.map;
    this.model = this.props.model;

    this.model.localObserver.subscribe(
      "geolocationChange",
      ({ accuracy, altitude, altitudeAccuracy, heading, speed }) => {
        this.setState({
          accuracy,
          altitude,
          altitudeAccuracy,
          heading,
          speed,
        });
      }
    );

    this.model.localObserver.subscribe("locationStatus", (status) => {
      switch (status) {
        case "loading":
          this.setState({ loading: true });
          break;
        case "on":
          this.setState({ loading: false });
          break;
        case "error":
          this.setState({ loading: false });
          break;
        case "off":
        default:
          this.setState({ loading: false });
          break;
      }
    });

    this.model.localObserver.subscribe("geolocationError", (error) => {
      this.props.enqueueSnackbar(
        `Kunde inte fastställa din plats. Felkod: ${error.code}. Detaljer: "${error.message}".`,
        {
          variant: "error",
        }
      );
    });
  }

  toggleTracking = (event) => {
    const { checked } = event.target;
    checked ? this.model.enable() : this.model.disable();
    this.setState({ track: checked });
    this.setState({ loading: checked });
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
              {Object.keys(this.locationDetails).map((row) => {
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
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(withSnackbar(LocationView));
