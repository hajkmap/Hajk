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
  state = {};

  constructor(props) {
    super(props);
    this.model = this.props.model;
    this.app = this.props.app;
    this.options = this.props.options;
    this.localObserver = this.props.localObserver;

    this.localObserver.subscribe(
      "setTransformedCoordinates",
      transformedCoordinates => {
        this.setState({
          transformedCoordinates: transformedCoordinates
        });
      }
    );
  }

  componentDidMount() {}

  componentWillUnmount() {
    this.model.deactivate();
  }

  renderProjections() {
    const { classes } = this.props;

    return (
      <>
        {this.state.transformedCoordinates
          ? this.state.transformedCoordinates.map((transformations, i) => {
              return (
                <TableRow key={i}>
                  <TableCell>
                    <Typography
                      variant="subtitle2"
                      style={{ display: "block" }}
                    >
                      {transformations.title}
                    </Typography>
                    <Typography
                      variant="subtitle2"
                      style={{ display: "block" }}
                    >
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
            })
          : null}
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

export default withStyles(styles)(CoordinatesView);
