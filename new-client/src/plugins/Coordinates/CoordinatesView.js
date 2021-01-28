import React from "react";
import Button from "@material-ui/core/Button";
import { withStyles } from "@material-ui/core/styles";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import TextField from "@material-ui/core/TextField";

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

class CoordinatesView extends React.PureComponent {
  state = {
    transformedCoordinates: [],
    errorField: "",
    errorValue: "",
  };

  constructor(props) {
    super(props);
    this.model = this.props.model;
    this.snackbarKey = null;
    this.localObserver = this.props.localObserver;

    this.localObserver.subscribe(
      "setTransformedCoordinates",
      (transformedCoordinates) => {
        this.setState(
          {
            transformedCoordinates: transformedCoordinates,
            errorField: "",
            errorValue: "",
          },
          () => {
            // React moves the cursor to the end for the field that was modified so we restore the position here
            if (
              this.props.model.updatedTransformId !== "" &&
              document.getElementById(this.props.model.updatedTransformId) !==
                null
            ) {
              document.getElementById(
                this.props.model.updatedTransformId
              ).selectionStart = this.props.model.updatedTransformIdx;
              document.getElementById(
                this.props.model.updatedTransformId
              ).selectionEnd = this.props.model.updatedTransformIdx;
            }
          }
        );
      }
    );

    this.localObserver.subscribe("errorInOnChange", (data) => {
      this.setState(
        {
          errorField: data.errorField,
          errorValue: data.errorValue,
        },
        () => {
          // React moves the cursor to the end for the field that was modified so we restore the position here

          document.getElementById(
            this.state.errorField
          ).selectionStart = this.props.model.updatedTransformIdx;
          document.getElementById(
            this.state.errorField
          ).selectionEnd = this.props.model.updatedTransformIdx;
        }
      );
    });

    /**
     * Setup listeners that will show/hide snackbar. The Model will publish
     * the following events in order to show/hide Snackbar.
     * Snackbar will show up to inform user to click in the map. When user has
     * clicked, or changed to another tool, the snackbar will close.
     */
    this.localObserver.subscribe("showSnackbar", () => {
      this.snackbarKey = this.props.enqueueSnackbar(
        "Klicka i kartan för att välja position.",
        {
          variant: "info",
          persist: true,
          anchorOrigin: {
            vertical: "bottom",
            horizontal: "center",
          },
        }
      );
    });

    this.localObserver.subscribe("hideSnackbar", () => {
      this.props.closeSnackbar(this.snackbarKey);
    });
  }

  componentWillUnmount() {
    this.model.deactivate();
  }

  renderProjections() {
    const { classes } = this.props;

    return (
      <>
        {this.state.transformedCoordinates.map((transformation, i) => {
          // Create the values for xCoord and yCoord where one might have a faulty format
          var xCoord = transformation.inverseAxis
            ? transformation.coordinates[0]
            : transformation.coordinates[1];
          var yCoord = transformation.inverseAxis
            ? transformation.coordinates[1]
            : transformation.coordinates[0];

          if (this.state.errorField === "coordinates-transforms-X-" + i) {
            xCoord = this.state.errorValue;
          } else if (
            this.state.errorField ===
            "coordinates-transforms-Y-" + i
          ) {
            yCoord = this.state.errorValue;
          }
          return (
            <TableRow key={i}>
              <TableCell>
                <Typography variant="body1" style={{ display: "flex" }}>
                  {transformation.title}
                </Typography>
                <Typography variant="body2" style={{ display: "flex" }}>
                  ({transformation.code})
                </Typography>
              </TableCell>
              <TableCell>
                <TextField
                  label={transformation.ytitle}
                  className={classes.textField}
                  id={"coordinates-transforms-X-" + i}
                  margin="dense"
                  variant="outlined"
                  value={xCoord}
                  onChange={this.model.handleInput}
                  transform={transformation.code}
                  axis={transformation.inverseAxis ? "X" : "Y"}
                  error={
                    this.state.errorField === "coordinates-transforms-X-" + i
                  }
                  helperText={
                    this.state.errorField === "coordinates-transforms-X-" + i
                      ? "Ange ett decimaltal"
                      : ""
                  }
                />
                <TextField
                  label={transformation.xtitle}
                  className={classes.textField}
                  id={"coordinates-transforms-Y-" + i}
                  margin="dense"
                  variant="outlined"
                  value={yCoord}
                  onChange={this.model.handleInput}
                  transform={transformation.code}
                  axis={transformation.inverseAxis ? "Y" : "X"}
                  error={
                    this.state.errorField === "coordinates-transforms-Y-" + i
                  }
                  helperText={
                    this.state.errorField === "coordinates-transforms-Y-" + i
                      ? "Ange ett decimaltal"
                      : ""
                  }
                />
              </TableCell>
            </TableRow>
          );
        })}
      </>
    );
  }

  render() {
    const { classes } = this.props;

    return (
      <>
        <Paper className={classes.root}>
          <Table className={classes.table}>
            <TableHead>
              <TableRow>
                <TableCell>Projektion</TableCell>
                <TableCell>Koordinater</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>{this.renderProjections()}</TableBody>
          </Table>
          <Button
            onClick={() => {
              this.props.model.zoomOnMarker();
            }}
          >
            Zooma
          </Button>
          <Button
            onClick={() => {
              this.props.model.centerOnMarker();
            }}
          >
            Panorera
          </Button>
        </Paper>
      </>
    );
  }
}

export default withStyles(styles)(withSnackbar(CoordinatesView));
