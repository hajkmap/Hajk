import React from "react";
import { styled } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import NumberFormat from "react-number-format";
import { transform } from "ol/proj";
import { withSnackbar } from "notistack";
import Grid from "@mui/material/Grid";

const StyledGridContainer = styled(Grid)(() => ({
  borderBottom: "1px solid #e0e0e0",
}));

const StyledNumberFormat = styled(NumberFormat)(({ theme }) => ({
  marginLeft: theme.spacing(0.75),
  marginRight: theme.spacing(0.75),
  minWidth: 120,
}));

//Styled Grid that centers text to the left
const StyledGrid = styled(Grid)(({ theme }) => ({
  textAlign: "left",
  width: 120,
  margin: theme.spacing(1.25),
}));

class CoordinatesTransformRow extends React.PureComponent {
  state = {
    errorX: "",
    errorY: "",
    coordinateX: "",
    coordinateY: "",
    coordinateXFloat: 0,
    coordinateYFloat: 0,
    wasLastChanged: false,
    wasModified: false,
  };

  constructor(props) {
    super(props);
    this.model = this.props.model;
    this.transformation = this.props.transformation;
    this.localObserver = this.props.model.localObserver;

    this.localObserver.subscribe("newCoordinates", (incomingCoords) => {
      // Force a change if the new coords from map click or user location since
      // there might be a transformation with the same code as on the map
      if (
        incomingCoords["proj"] !== this.transformation.code ||
        incomingCoords["force"]
      ) {
        const transformedCoords = transform(
          incomingCoords["coordinates"],
          incomingCoords["proj"],
          this.props.transformation.code
        );
        this.setState({
          errorX: "",
          errorY: "",
          wasModified: true,
          coordinateX: transformedCoords[0].toFixed(
            this.transformation.precision
          ),
          coordinateY: transformedCoords[1].toFixed(
            this.transformation.precision
          ),
          coordinateXFloat: transformedCoords[0],
          coordinateYFloat: transformedCoords[1],
          wasLastChanged: false,
        });
      } else {
        this.setState({ wasLastChanged: true, wasModified: true });
      }
    });

    this.localObserver.subscribe("resetCoordinates", () => {
      this.setState({
        errorX: "",
        errorY: "",
        coordinateX: "",
        coordinateY: "",
        coordinateXFloat: 0,
        coordinateYFloat: 0,
      });
    });
  }

  handleInputX(event) {
    if (
      (!this.props.inverseAxis && event.value === this.state.coordinateX) ||
      (this.props.inverseAxis && event.value === this.state.coordinateY)
    ) {
      // Nothing was changed so do nothing, this happens since the value is
      // changed multiple times during formatting and we do not want to create
      // infinite loops
      return;
    }
    if (!this.props.inverseAxis) {
      // Validate that the changed data is a finite number
      this.setState({
        coordinateX: event.value,
        coordinateXFloat: event.floatValue,
        wasModified: true,
      });
    } else {
      this.setState({
        coordinateY: event.value,
        coordinateYFloat: event.floatValue,
        wasModified: true,
      });
    }
    if (isNaN(event.floatValue) || !isFinite(event.floatValue)) {
      this.setState({ errorX: "Ange ett decimaltal" });
    } else {
      this.setState({ errorX: "" });
      const updatedValue = event.floatValue;

      if (!this.props.inverseAxis) {
        // publish the new value so all other transformations and the marker is updated
        this.localObserver.publish("newCoordinates", {
          coordinates: [updatedValue, this.state.coordinateYFloat],
          proj: this.props.transformation.code,
          force: false,
        });
      } else {
        // publish the new value so all other transformations and the marker is updated
        this.localObserver.publish("newCoordinates", {
          coordinates: [this.state.coordinateXFloat, updatedValue],
          proj: this.props.transformation.code,
          force: false,
        });
      }
    }
  }

  handleInputY(event) {
    if (
      (!this.props.inverseAxis && event.value === this.state.coordinateY) ||
      (this.props.inverseAxis && event.value === this.state.coordinateX)
    ) {
      // Nothing was changed so do nothing, this happens since the value is
      // changed multiple times during formatting and we do not want to create
      // infinite loops
      return;
    }
    if (!this.props.inverseAxis) {
      // Validate that the changed data is a finite number
      this.setState({
        coordinateY: event.value,
        coordinateYFloat: event.floatValue,
        wasModified: true,
      });
    } else {
      this.setState({
        coordinateX: event.value,
        coordinateXFloat: event.floatValue,
        wasModified: true,
      });
    }
    if (isNaN(event.floatValue) || !isFinite(event.floatValue)) {
      this.setState({ errorY: "Ange ett decimaltal" });
    } else {
      this.setState({ errorY: "" });
      const updatedValue = event.floatValue;

      if (!this.props.inverseAxis) {
        // publish the new value so all other transformations and the marker is updated
        this.localObserver.publish("newCoordinates", {
          coordinates: [this.state.coordinateXFloat, updatedValue],
          proj: this.props.transformation.code,
          force: false,
        });
      } else {
        // publish the new value so all other transformations and the marker is updated
        this.localObserver.publish("newCoordinates", {
          coordinates: [updatedValue, this.state.coordinateYFloat],
          proj: this.props.transformation.code,
          force: false,
        });
      }
    }
  }

  componentWillUnmount() {}

  render() {
    let xCoord = this.props.inverseAxis
      ? this.state.coordinateY
      : this.state.coordinateX;
    let yCoord = this.props.inverseAxis
      ? this.state.coordinateX
      : this.state.coordinateY;

    if (this.model.showFieldsOnStart || this.state.wasModified) {
      return (
        <Grid container item spacing={2} rowSpacing={1} sx={{ mb: 1 }}>
          <Grid item xs={12}>
            <Typography variant="body2" style={{ fontWeight: 600 }}>
              {this.transformation
                ? this.transformation.title +
                  " (" +
                  this.transformation.code +
                  ")"
                : ""}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={6}>
            <NumberFormat
              label={this.props.transformation.xtitle}
              margin="dense"
              variant="outlined"
              size="small"
              value={xCoord}
              name="numberformatX"
              type="text"
              onValueChange={(values) => {
                this.handleInputX(values);
              }}
              axis={this.props.transformation.inverseAxis ? "X" : "Y"}
              error={this.state.errorX !== ""}
              helperText={this.state.errorX}
              thousandSeparator={this.model.thousandSeparator ? " " : false}
              customInput={TextField}
              fullWidth={true}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={6}>
            <NumberFormat
              label={this.props.transformation.ytitle}
              margin="dense"
              size="small"
              variant="outlined"
              value={yCoord}
              name="numberformatY"
              type="text"
              onValueChange={(values) => {
                this.handleInputY(values);
              }}
              axis={this.props.transformation.inverseAxis ? "Y" : "X"}
              error={this.state.errorY !== ""}
              helperText={this.state.errorY}
              thousandSeparator={this.model.thousandSeparator ? " " : false}
              customInput={TextField}
              fullWidth={true}
            />
          </Grid>
        </Grid>
      );
    } else {
      return <></>;
    }
  }
}

export default withSnackbar(CoordinatesTransformRow);
