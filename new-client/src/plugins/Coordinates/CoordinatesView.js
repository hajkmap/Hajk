import React from "react";
import Button from "@mui/material/Button";
import { styled } from "@mui/material/styles";
import Grid from "@mui/material/Grid";
import CoordinatesTransformRow from "./CoordinatesTransformRow.js";
import { Tooltip } from "@mui/material";

import { withSnackbar } from "notistack";

const Root = styled("div")(() => ({
  margin: -10,
  display: "flex",
  flexDirection: "column",
  height: "100%",
  overflowX: "hidden",
}));

const StyledButton = styled(Button)(({ theme }) => ({
  [theme.breakpoints.down("md")]: {
    minWidth: "100%",
  },
  [theme.breakpoints.up("md")]: {
    minWidth: 136,
  },
  margin: theme.spacing(0.5),
}));

const StyledGridContainer = styled(Grid)(() => ({
  borderBottom: "1px solid #e0e0e0",
}));

//Styled Grid that centers text to the left
const StyledGrid = styled(Grid)(({ theme }) => ({
  textAlign: "left",
  width: 120,
  margin: theme.spacing(1),
  color: theme.palette.text.secondary,
}));

const StyledGridItem = styled(Grid)(({ theme }) => ({
  margin: theme.spacing(0.5),
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
      <Root>
        <StyledGridContainer container spacing={1}>
          <Grid item>
            <StyledGrid>Projektion</StyledGrid>
          </Grid>
          <Grid item xs>
            <StyledGrid>Koordinater</StyledGrid>
          </Grid>
        </StyledGridContainer>
        {this.renderProjections()}
        <Grid container spacing={1}>
          <StyledGridItem item xs={12}>
            <Tooltip title="Rensa fält">
              <StyledButton
                variant="contained"
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
                onClick={() => {
                  this.props.model.zoomOnMarker();
                }}
              >
                Zooma
              </StyledButton>
            </Tooltip>
          </StyledGridItem>
        </Grid>
      </Root>
    );
  }
}

export default withSnackbar(CoordinatesView);
