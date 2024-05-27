import React, { useEffect, useRef } from "react";
import Button from "@mui/material/Button";
import { styled } from "@mui/material/styles";
import Grid from "@mui/material/Grid";
import CoordinatesTransformRow from "./CoordinatesTransformRow";
import { Divider } from "@mui/material";
import { useSnackbar } from "notistack";
import HajkToolTip from "components/HajkToolTip";

import {
  LOCATION_DENIED_SNACK_OPTIONS,
  LOCATION_DENIED_SNACK_MESSAGE,
} from "../Location/constants";

const StyledGridContainer = styled(Grid)(({ theme }) => ({
  padding: theme.spacing(2),
}));

const CoordinatesView = ({ model, localObserver }) => {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const snackbarKeyRef = useRef(null);

  useEffect(() => {
    const showSnackbar = () => {
      snackbarKeyRef.current = enqueueSnackbar(
        "Klicka i kartan för att välja position.",
        {
          variant: "info",
          persist: true,
          anchorOrigin: {
            vertical: "bottom",
            horizontal: "center",
          },
          sx: {
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
                model.closeSnackbar();
              }}
            >
              Stäng
            </Button>
          ),
        }
      );
    };

    const hideSnackbar = () => {
      closeSnackbar(snackbarKeyRef.current);
    };

    const locationPermissionsDenied = () => {
      enqueueSnackbar(
        LOCATION_DENIED_SNACK_MESSAGE,
        LOCATION_DENIED_SNACK_OPTIONS
      );
    };

    localObserver.subscribe("showSnackbar", showSnackbar);
    localObserver.subscribe("hideSnackbar", hideSnackbar);
    localObserver.subscribe(
      "location-permissions-denied",
      locationPermissionsDenied
    );

    return () => {
      model.deactivate();
      localObserver.unsubscribe("showSnackbar", showSnackbar);
      localObserver.unsubscribe("hideSnackbar", hideSnackbar);
      localObserver.unsubscribe(
        "location-permissions-denied",
        locationPermissionsDenied
      );
    };
  }, [enqueueSnackbar, closeSnackbar, localObserver, model]);

  const renderProjections = () => (
    <>
      {model.transformations.map((transformation, index) => (
        <CoordinatesTransformRow
          key={`${transformation.code}${index}-element`}
          model={model}
          transformation={transformation}
          inverseAxis={transformation.inverseAxis}
        />
      ))}
    </>
  );

  const renderButtons = () => (
    <Grid
      container
      item
      spacing={2}
      rowSpacing={1}
      sx={{ mb: { xs: 6, sm: 0, md: 0 } }}
    >
      <Grid item xs={12} md={6}>
        <HajkToolTip title="Rensa fält">
          <Button
            fullWidth
            variant="contained"
            color="primary"
            onClick={() => {
              model.resetCoords();
            }}
          >
            Rensa
          </Button>
        </HajkToolTip>
      </Grid>
      <Grid item xs={12} md={6}>
        <HajkToolTip title="Min position">
          <Button
            fullWidth
            variant="contained"
            color="primary"
            onClick={() => {
              model.goToUserLocation();
            }}
          >
            Min position
          </Button>
        </HajkToolTip>
      </Grid>
      <Grid item xs={12} sm={6} md={6}>
        <HajkToolTip title="Panorera till markering">
          <Button
            fullWidth
            variant="contained"
            color="primary"
            onClick={() => {
              model.centerOnMarker();
            }}
          >
            Panorera
          </Button>
        </HajkToolTip>
      </Grid>
      <Grid item xs={12} sm={6} md={6}>
        <HajkToolTip title="Zooma in till markering">
          <Button
            fullWidth
            variant="contained"
            color="primary"
            onClick={() => {
              model.zoomOnMarker();
            }}
          >
            Zooma
          </Button>
        </HajkToolTip>
      </Grid>
    </Grid>
  );

  return (
    <Grid container>
      <StyledGridContainer container rowSpacing={2} columnSpacing={1}>
        {renderProjections()}
      </StyledGridContainer>
      <Grid item xs={12}>
        <Divider />
      </Grid>
      <StyledGridContainer container rowSpacing={2} columnSpacing={1}>
        {renderButtons()}
      </StyledGridContainer>
    </Grid>
  );
};

export default CoordinatesView;
