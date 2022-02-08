import React from "react";
import Button from "@mui/material/Button";
import { styled } from "@mui/material/styles";
import Grid from "@mui/material/Grid";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import CoordinatesTransformRow from "./CoordinatesTransformRow.js";

import { withSnackbar } from "notistack";

const StyledPaper = styled(Paper)(() => ({
  backgroundImage: "none",
  display: "flex",
  flexGrow: 1,
  flexWrap: "wrap",
}));

const StyledButton = styled(Button)(({ theme }) => ({
  minWidth: 64,
  margin: 0,
}));

class CoordinatesView extends React.PureComponent {
  state = {};

  constructor(props) {
    super(props);
    this.model = this.props.model;
    this.snackbarKey = null;
    this.localObserver = this.props.localObserver;

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
    return (
      <>
        {this.props.model.transformations.map((transformation, index) => {
          return (
            <CoordinatesTransformRow
              key={transformation.code + index + "-element"}
              model={this.model}
              transformation={transformation}
              inverseAxis={transformation.inverseAxis}
            />
          );
        })}
      </>
    );
  }

  render() {
    return (
      <>
        <StyledPaper>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Projektion</TableCell>
                <TableCell>Koordinater</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>{this.renderProjections()}</TableBody>
          </Table>
          <Grid container justifyContent="space-between">
            <StyledButton
              variant="text"
              onClick={() => {
                this.props.model.zoomOnMarker();
              }}
            >
              Zooma
            </StyledButton>
            <StyledButton
              variant="text"
              onClick={() => {
                this.props.model.centerOnMarker();
              }}
            >
              Panorera
            </StyledButton>
            <StyledButton
              variant="text"
              onClick={() => {
                this.props.model.goToUserLocation();
              }}
            >
              Min position
            </StyledButton>
            <StyledButton
              variant="text"
              onClick={() => {
                this.props.model.resetCoords();
              }}
            >
              Rensa fält
            </StyledButton>
          </Grid>
        </StyledPaper>
      </>
    );
  }
}

export default withSnackbar(CoordinatesView);
