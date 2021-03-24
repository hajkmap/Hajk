import React from "react";
import { withStyles } from "@material-ui/core/styles";
import TableCell from "@material-ui/core/TableCell";
import TableRow from "@material-ui/core/TableRow";
import Typography from "@material-ui/core/Typography";
import TextField from "@material-ui/core/TextField";
import { transform } from "ol/proj";
import { withSnackbar } from "notistack";

const styles = (theme) => ({
  root: {
    display: "flex",
    flexGrow: 1,
    flexWrap: "wrap",
  },
  text: {
    "& .ol-mouse-position": {
      top: "unset",
      right: "unset",
      position: "unset",
    },
  },
  table: {},
  textField: {
    marginLeft: theme.spacing(1),
    marginRight: theme.spacing(1),
    marginTop: theme.spacing(2),
  },
});

class CoordinatesTransformRow extends React.PureComponent {
  state = {
    errorX: "",
    errorY: "",
    coordinateX: "",
    coordinateY: "",
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
          coordinateX: transformedCoords[0].toFixed(
            this.transformation.precision
          ),
          coordinateY: transformedCoords[1].toFixed(
            this.transformation.precision
          ),
        });
      }
    });

    this.localObserver.subscribe("resetCoordinates", () => {
      this.setState({
        errorX: "",
        errorY: "",
        coordinateX: "",
        coordinateY: "",
      });
    });
  }

  handleInputX(event) {
    // Validate that the changed data is a finite number
    this.setState({ coordinateX: event.target.value });
    if (isNaN(event.target.value) || !isFinite(event.target.value)) {
      this.setState({ errorX: "Ange ett decimaltal" });
    } else {
      this.setState({ errorX: "" });
      const updatedValue = parseFloat(event.target.value);

      // publish the new value so all other transformations and the marker is updated
      this.localObserver.publish("newCoordinates", {
        coordinates: [updatedValue, this.state.coordinateY],
        proj: this.props.transformation.code,
        force: false,
      });
    }
  }

  handleInputY(event) {
    // Validate that the changed data is a finite number
    this.setState({ coordinateY: event.target.value });
    if (isNaN(event.target.value) || !isFinite(event.target.value)) {
      this.setState({ errorY: "Ange ett decimaltal" });
    } else {
      this.setState({ errorY: "" });
      const updatedValue = parseFloat(event.target.value);

      // publish the new value so all other transformations and the marker is updated
      this.localObserver.publish("newCoordinates", {
        coordinates: [this.state.coordinateX, updatedValue],
        proj: this.props.transformation.code,
        force: false,
      });
    }
  }

  componentWillUnmount() {}

  render() {
    // TODO check that the size settings in admin panel are not destroyed
    const { classes } = this.props;

    let xCoord = this.props.inverseAxis
      ? this.state.coordinateY
      : this.state.coordinateX;
    let yCoord = this.props.inverseAxis
      ? this.state.coordinateX
      : this.state.coordinateY;
    if (this.model.prettyPrint && xCoord !== "" && yCoord !== "") {
      xCoord = parseFloat(xCoord).toLocaleString();
      yCoord = parseFloat(yCoord).toLocaleString();
    }

    if (this.model.showFieldsOnStart || xCoord !== "" || yCoord !== "") {
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
            <TextField
              label={this.props.transformation.ytitle}
              className={classes.textField}
              margin="dense"
              variant="outlined"
              value={xCoord}
              onChange={this.handleInputX.bind(this)}
              axis={this.props.transformation.inverseAxis ? "X" : "Y"}
              error={this.state.errorX !== ""}
              helperText={this.state.errorX}
            />
            <TextField
              label={this.props.transformation.xtitle}
              className={classes.textField}
              margin="dense"
              variant="outlined"
              value={yCoord}
              onChange={this.handleInputY.bind(this)}
              axis={this.props.transformation.inverseAxis ? "Y" : "X"}
              error={this.state.errorY !== ""}
              helperText={this.state.errorY}
            />
          </TableCell>
        </TableRow>
      );
    } else {
      return <></>;
    }
  }
}

export default withStyles(styles)(withSnackbar(CoordinatesTransformRow));
