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
  constructor(props) {
    super(props);
    this.model = this.props.model;
    this.app = this.props.app;
    this.options = this.props.options;
    this.localObserver = this.props.localObserver;

    this.transformations = this.props.options.transformations;
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
                <TableCell>{coordinates.code}</TableCell>
                <TableCell>
                  <Typography style={{ display: "block" }}>
                    {coordinates.ytitle}:{" "}
                  </Typography>
                  <Typography style={{ display: "block" }}>
                    {coordinates.xtitle}:{" "}
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
            <TableCell>Sweref 99 12 00</TableCell>
            <TableCell>
              <Typography style={{ display: "block" }}>N: </Typography>
              <Typography style={{ display: "block" }}>E: </Typography>
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
                <TableCell>Koordinatsystem</TableCell>
                <TableCell>Koordinater</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>{this.renderProjections()}</TableBody>
          </Table>
        </Paper>
        <span id="coordinatesContainer" className={classes.text}>
          Marker coordinates: {this.props.coordinates}
        </span>
      </>
    );
  }
}

export default withStyles(styles)(CoordinatesView);
