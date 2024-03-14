import React from "react";
import Button from "@mui/material/Button";
import { styled } from "@mui/material/styles";
import Grid from "@mui/material/Grid";
import CoordinatesTransformRow from "./CoordinatesTransformRow.js";
import { Divider, Tooltip } from "@mui/material";

import { withSnackbar } from "notistack";

import {
  LOCATION_DENIED_SNACK_OPTIONS,
  LOCATION_DENIED_SNACK_MESSAGE,
} from "../Location/constants";

const StyledGridContainer = styled(Grid)(({ theme }) => ({
  padding: theme.spacing(2),
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
          sx: {
            // Custom styling to follow Material Design guidelines for Snackbar.
            // Placing the close button to the right of the text.
            ".SnackbarItem-contentRoot": {
              flexWrap: "inherit !important",
            },
          },
          action: (key) => (
            <Button
              aria-label="close"
              color="inherit"
              id={key}
              onClick={() => {
                this.props.model.closeSnackbar();
              }}
            >
              Stäng
            </Button>
          ),
        }
      );
    });

    this.localObserver.subscribe("hideSnackbar", () => {
      this.props.closeSnackbar(this.snackbarKey);
    });

    this.localObserver.subscribe("location-permissions-denied", () => {
      this.props.enqueueSnackbar(
        LOCATION_DENIED_SNACK_MESSAGE,
        LOCATION_DENIED_SNACK_OPTIONS
      );
    });
  }

  componentWillUnmount() {
    this.model.deactivate();
  }

  renderProjections() {
    return (
      <>
        {this.props.model.transformations.map((transformation, index) => (
          <CoordinatesTransformRow
            key={`${transformation.code}${index}-element`}
            model={this.model}
            transformation={transformation}
            inverseAxis={transformation.inverseAxis}
          />
        ))}
      </>
    );
  }

  renderButtons() {
    return (
      <Grid
        container
        item
        spacing={2}
        rowSpacing={1}
        sx={{ mb: { xs: 6, sm: 0, md: 0 } }}
      >
        <Grid item xs={12} md={6}>
          <Tooltip title="Rensa fält">
            <Button
              fullWidth={true}
              variant="contained"
              color="primary"
              onClick={() => {
                this.props.model.resetCoords();
              }}
            >
              Rensa
            </Button>
          </Tooltip>
        </Grid>
        <Grid item xs={12} md={6}>
          <Tooltip title="Min position">
            <Button
              fullWidth={true}
              variant="contained"
              color="primary"
              onClick={() => {
                this.props.model.goToUserLocation();
              }}
            >
              Min position
            </Button>
          </Tooltip>
        </Grid>
        <Grid item xs={12} sm={6} md={6}>
          <Tooltip title="Panorera till markering">
            <Button
              fullWidth={true}
              variant="contained"
              color="primary"
              onClick={() => {
                this.props.model.centerOnMarker();
              }}
            >
              Panorera
            </Button>
          </Tooltip>
        </Grid>
        <Grid item xs={12} sm={6} md={6}>
          <Tooltip title="Zooma in till markering">
            <Button
              fullWidth={true}
              variant="contained"
              color="primary"
              onClick={() => {
                this.props.model.zoomOnMarker();
              }}
            >
              Zooma
            </Button>
          </Tooltip>
        </Grid>
      </Grid>
    );
  }

  render() {
    return (
      <Grid container>
        <StyledGridContainer container rowSpacing={2} columnSpacing={1}>
          {this.renderProjections()}
        </StyledGridContainer>
        <Grid item xs={12}>
          <Divider />
        </Grid>
        <StyledGridContainer container rowSpacing={2} columnSpacing={1}>
          {this.renderButtons()}
        </StyledGridContainer>
      </Grid>
    );
  }
}

export default withSnackbar(CoordinatesView);
