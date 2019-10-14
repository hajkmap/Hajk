import React from "react";
import { withStyles } from "@material-ui/core/styles";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";

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
  table: {}
});

class CoordinatesView extends React.PureComponent {
  state = {};

  constructor(props) {
    super(props);
    this.model = this.props.model;
    this.app = this.props.app;
    this.options = this.props.options;
    this.localObserver = this.props.localObserver;

    this.transformations = this.props.options.transformations;

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
    if (this.transformations.length) {
      return (
        <>
          {this.transformations.map((coordinates, i) => {
            return (
              <TableRow key={i}>
                <TableCell>
                  <Typography variant="subtitle2" style={{ display: "block" }}>
                    {coordinates.title} ({coordinates.code})
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography style={{ display: "block" }}>
                    {coordinates.ytitle}:
                    {this.state.transformedCoordinates
                      ? this.state.transformedCoordinates[i].coordinates[1]
                      : ""}
                  </Typography>
                  <Typography style={{ display: "block" }}>
                    {coordinates.xtitle}:
                    {this.state.transformedCoordinates
                      ? this.state.transformedCoordinates[i].coordinates[0]
                      : ""}
                  </Typography>
                </TableCell>
              </TableRow>
            );
          })}
        </>
      );
    } else {
      return (
        <>
          <TableRow>
            <TableCell>
              <Typography variant="subtitle2" style={{ display: "block" }}>
                Sweref 99 12 00
              </Typography>
            </TableCell>
            <TableCell>
              <Typography style={{ display: "block" }}>
                N: {this.props.coordinates}
              </Typography>
              <Typography style={{ display: "block" }}>
                E: {this.props.coordinates}
              </Typography>
            </TableCell>
          </TableRow>
        </>
      );
    }
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
