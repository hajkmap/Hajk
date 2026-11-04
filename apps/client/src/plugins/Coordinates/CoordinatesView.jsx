import React from "react";
import Button from "@mui/material/Button";
import { styled } from "@mui/material/styles";
import DeleteIcon from "@mui/icons-material/Delete";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import PanToolIcon from "@mui/icons-material/PanTool";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import Grid from "@mui/material/Grid";
import CoordinatesTransformRow from "./CoordinatesTransformRow";
import { Divider } from "@mui/material";

import withSnackbar from "components/WithSnackbar";
import HajkToolTip from "components/HajkToolTip";
import i18n from "src/i18n";

import { LOCATION_DENIED_SNACK_OPTIONS } from "../Location/constants";

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
        i18n.t("coordinates.clickInMap"),
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
              aria-label={i18n.t("common.close")}
              color="inherit"
              id={key}
              onClick={() => {
                this.props.model.closeSnackbar();
              }}
            >
              {i18n.t("common.close")}
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
        i18n.t("common.geolocationPermissionDenied"),
        LOCATION_DENIED_SNACK_OPTIONS
      );
    });
  }

  componentDidMount() {
    this.#publishInitialCoordinates();
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.windowVisible && this.props.windowVisible) {
      this.#publishInitialCoordinates();
    }
  }

  #publishInitialCoordinates() {
    if (this.props.windowVisible && this.model.showFieldsOnStart) {
      this.localObserver.publish("newCoordinates", {
        coordinates: this.model.map.getView().getCenter(),
        proj: this.model.map.getView().getProjection().getCode(),
        force: true,
      });
    }
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
        spacing={2}
        rowSpacing={1}
        sx={{ mb: { xs: 6, sm: 0, md: 0 } }}
      >
        <Grid
          size={{
            xs: 6,
          }}
        >
          <HajkToolTip title={i18n.t("coordinates.clearFields")}>
            <Button
              fullWidth={true}
              variant="contained"
              color="primary"
              startIcon={<DeleteIcon />}
              onClick={() => {
                this.props.model.resetCoords();
              }}
            >
              {i18n.t("search.results.clear")}
            </Button>
          </HajkToolTip>
        </Grid>
        <Grid
          size={{
            xs: 6,
          }}
        >
          <HajkToolTip title={i18n.t("coordinates.myPosition")}>
            <Button
              fullWidth={true}
              variant="contained"
              color="primary"
              startIcon={<MyLocationIcon />}
              onClick={() => {
                this.props.model.goToUserLocation();
              }}
            >
              {i18n.t("coordinates.myPosition")}
            </Button>
          </HajkToolTip>
        </Grid>
        <Grid
          size={{
            xs: 6,
          }}
        >
          <HajkToolTip title={i18n.t("coordinates.panToMarkerTooltip")}>
            <Button
              fullWidth={true}
              variant="contained"
              color="primary"
              startIcon={<PanToolIcon />}
              onClick={() => {
                this.props.model.centerOnMarker();
              }}
            >
              {i18n.t("coordinates.panToMarker")}
            </Button>
          </HajkToolTip>
        </Grid>
        <Grid
          size={{
            xs: 6,
          }}
        >
          <HajkToolTip title={i18n.t("coordinates.zoomToMarkerTooltip")}>
            <Button
              fullWidth={true}
              variant="contained"
              color="primary"
              startIcon={<ZoomInIcon />}
              onClick={() => {
                this.props.model.zoomOnMarker();
              }}
            >
              {i18n.t("coordinates.zoomToMarker")}
            </Button>
          </HajkToolTip>
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
        <Grid size={12}>
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
