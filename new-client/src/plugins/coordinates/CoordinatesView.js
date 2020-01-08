import React from "react";
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

const styles = theme => ({
  root: {
    display: "flex",
    flexGrow: 1,
    flexWrap: "wrap"
  },
  text: {
    "& .ol-mouse-position": {
      top: "unset",
      right: "unset",
      position: "unset"
    }
  },
  table: {},
  textField: {
    marginLeft: theme.spacing(1),
    marginRight: theme.spacing(1),
    marginTop: theme.spacing(2)
  }
});

class CoordinatesView extends React.PureComponent {
  state = {
    transformedCoordinates: []
  };

  constructor(props) {
    super(props);
    this.model = this.props.model;
    this.snackbarKey = null;
    this.localObserver = this.props.localObserver;

    this.localObserver.subscribe(
      "setTransformedCoordinates",
      transformedCoordinates => {
        this.setState({
          transformedCoordinates: transformedCoordinates
        });
      }
    );

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
            horizontal: "center"
          }
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
        {this.state.transformedCoordinates.map((transformations, i) => {
          return (
            <TableRow key={i}>
              <TableCell>
                <Typography variant="body1" style={{ display: "flex" }}>
                  {transformations.title}
                </Typography>
                <Typography variant="body2" style={{ display: "flex" }}>
                  ({transformations.code})
                </Typography>
              </TableCell>
              <TableCell>
                <TextField
                  label={transformations.ytitle}
                  className={classes.textField}
                  margin="dense"
                  variant="outlined"
                  value={
                    transformations.inverseAxis
                      ? transformations.coordinates[0]
                      : transformations.coordinates[1]
                  }
                />
                <TextField
                  label={transformations.xtitle}
                  className={classes.textField}
                  margin="dense"
                  variant="outlined"
                  value={
                    transformations.inverseAxis
                      ? transformations.coordinates[1]
                      : transformations.coordinates[0]
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
        </Paper>
      </>
    );
  }
}

export default withStyles(styles)(withSnackbar(CoordinatesView));
