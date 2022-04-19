import React from "react";
import { styled } from "@mui/material/styles";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import NumberFormat from "react-number-format";
import { transform } from "ol/proj";
import { withSnackbar } from "notistack";

const StyledNumberFormat = styled(NumberFormat)(({ theme }) => ({
  marginLeft: theme.spacing(1),
  marginRight: theme.spacing(1),
  marginTop: theme.spacing(2),
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
        <TableRow key={this.props.transformation.code}>
          <TableCell>
            <Typography variant="body1" style={{ display: "flex" }}>
              {this.props.transformation.title}
            </Typography>
            <Typography variant="body2" style={{ display: "flex" }}>
              ({this.props.transformation.code})
            </Typography>
          </TableCell>
          <TableCell>
            <StyledNumberFormat
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
            />
            <StyledNumberFormat
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
            />
          </TableCell>
        </TableRow>
      );
    } else {
      return <></>;
    }
  }
}

export default withSnackbar(CoordinatesTransformRow);
