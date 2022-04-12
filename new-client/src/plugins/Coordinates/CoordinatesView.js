import React from "react";
import Button from "@mui/material/Button";
import { styled } from "@mui/material/styles";
import Grid from "@mui/material/Grid";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
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
  [theme.breakpoints.down("md")]: {
    minWidth: "100%",
  },
  [theme.breakpoints.up("md")]: {
    minWidth: 120,
  },
  margin: theme.spacing(0.5),
}));

const StyledGrid = styled(Grid)(() => ({
  borderBottom: "1px solid #e0e0e0",
  padding: 1,
}));

const StyledGridColumn = styled(Grid)(({ theme }) => ({
  [theme.breakpoints.down("md")]: {
    width: "100%",
  },
  [theme.breakpoints.up("md")]: {
    width: 130,
    marginRight: theme.spacing(1),
  },
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
      <StyledPaper>
        <StyledGrid container>
          <StyledGridColumn>
            <Typography variant="body2">Projektion</Typography>
          </StyledGridColumn>
          <StyledGridColumn>
            <Typography variant="body2">Koordinater</Typography>
          </StyledGridColumn>
        </StyledGrid>
        <Grid>{this.renderProjections()}</Grid>
        <Grid container>
          <Tooltip title="Rensa fält">
            <StyledButton
              variant="contained"
              size="small"
              onClick={() => {
                this.props.model.resetCoords();
              }}
            >
              Rensa fält
            </StyledButton>
          </Tooltip>
          <Tooltip title="Min position">
            <StyledButton
              variant="contained"
              size="small"
              onClick={() => {
                this.props.model.goToUserLocation();
              }}
            >
              Min position
            </StyledButton>
          </Tooltip>
          <Tooltip title="Panorera till markering">
            <StyledButton
              variant="contained"
              size="small"
              onClick={() => {
                this.props.model.centerOnMarker();
              }}
            >
              Panorera
            </StyledButton>
          </Tooltip>
          <Tooltip title="Zooma till markering">
            <StyledButton
              variant="contained"
              size="small"
              onClick={() => {
                this.props.model.zoomOnMarker();
              }}
            >
              Zooma
            </StyledButton>
          </Tooltip>
        </Grid>
      </StyledPaper>
    );
  }
}

export default withSnackbar(CoordinatesView);
