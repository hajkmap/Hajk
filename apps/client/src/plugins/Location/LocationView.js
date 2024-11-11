import React from "react";

import { withSnackbar } from "notistack";

import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import LinearProgress from "@mui/material/LinearProgress";

import {
  LOCATION_DENIED_SNACK_MESSAGE,
  LOCATION_DENIED_SNACK_OPTIONS,
} from "./constants";

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
      // If error code is 1 (User denied Geolocation), show Snackbar with instructions to enable it again
      if (error.code === 1) {
        this.props.enqueueSnackbar(
          LOCATION_DENIED_SNACK_MESSAGE,
          LOCATION_DENIED_SNACK_OPTIONS
        );
      } else {
        this.props.enqueueSnackbar(
          `Kunde inte fastställa din plats. Felkod: ${error.code}. Detaljer: "${error.message}".`,
          {
            variant: "error",
          }
        );
      }
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

export default withSnackbar(LocationView);
