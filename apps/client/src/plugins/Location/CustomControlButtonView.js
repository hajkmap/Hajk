import React, { useEffect, useCallback } from "react";
import { useSnackbar } from "notistack";

import { Paper } from "@mui/material";
import { styled } from "@mui/material/styles";
import ToggleButton from "@mui/material/ToggleButton";
import CircularProgress from "@mui/material/CircularProgress";
import LocationSearchingIcon from "@mui/icons-material/LocationSearching";
import LocationDisabledIcon from "@mui/icons-material/LocationDisabled";
import MyLocationIcon from "@mui/icons-material/MyLocation";

import {
  LOCATION_DENIED_SNACK_MESSAGE,
  LOCATION_DENIED_SNACK_OPTIONS,
} from "./constants";
import HajkToolTip from "components/HajkToolTip";

const StyledPaper = styled(Paper)(({ theme }) => ({
  marginBottom: theme.spacing(1),
}));

const StyledToggleButton = styled(ToggleButton)(() => ({
  minWidth: "unset",
  // ToggleButton have a different color when not selected,
  // but we want to unset it so it looks just like other Buttons.
  color: "unset",
  paddingLeft: 7,
  paddingRight: 7,
  paddingTop: 6,
  paddingBottom: 6,
}));

const CustomControlButtonView = React.memo(
  ({ onClick, defaultTooltip, model }) => {
    const { enqueueSnackbar } = useSnackbar();

    const [selected, setSelected] = React.useState(false);
    const [tooltip, setTooltip] = React.useState(defaultTooltip);
    const [currentIcon, setCurrentIcon] = React.useState(
      <LocationSearchingIcon />
    );

    // Handler for the "geoLocationChange" event. Makes sure to format the raw input data
    // and update state with nice looking messages.
    const handleGeoLocationChange = useCallback((rawData) => {
      // We must do some formatting (to limit the decimal precision on
      // some values). Let's prepare an object.
      const formattedData = {};

      // Loop through the entries of rawData and limit precision to one
      // decimal point on all numbers.
      for (let k in rawData) {
        formattedData[k] = Number.isFinite(rawData[k])
          ? rawData[k].toFixed(1)
          : rawData[k];
      }

      // Prepare an output array that contains end-user text
      const output = [
        ...(formattedData.accuracy
          ? [`Nogranhet: ${formattedData.accuracy} m\n`]
          : []),
        ...(formattedData.altitude && formattedData.altitudeAccuracy
          ? [
              `Höjd: ${formattedData.altitude} (+/- ${formattedData.altitudeAccuracy}) m\n`,
            ]
          : []),
        ...(formattedData.speed
          ? [`Hastighet: ${formattedData.speed} km/h\n`]
          : []),
        ...(formattedData.heading
          ? [`Riktning: ${formattedData.heading} rad\n`]
          : []),
      ];

      // Create the actual string that will be rendered inside the Tooltip component.
      // The 'display: block' part is important to create line breaks inside Tooltip.
      const str = (
        <React.Fragment>
          {output.map((v, i) => {
            return (
              <div key={i} style={{ display: "block" }}>
                {v}
              </div>
            );
          })}
        </React.Fragment>
      );

      setTooltip(str);
    }, []);

    // Handler for the "locationStatus" event. Makes sure to update the state according
    // to the current location status.
    const handleStatusChange = useCallback(
      (status) => {
        switch (status) {
          case "loading":
            setCurrentIcon(<CircularProgress size={24} />);
            break;
          case "on":
            setCurrentIcon(<MyLocationIcon />);
            break;
          case "error":
            setCurrentIcon(<LocationDisabledIcon />);
            setTooltip("Positionera: position ej tillgänglig");
            break;
          case "off":
          default:
            setCurrentIcon(<LocationSearchingIcon />);
            setTooltip(defaultTooltip);
            break;
        }
      },
      [defaultTooltip]
    );

    // Handler for the "locationError" event. Makes sure to prompt the user with information
    // regarding the error along with information on how to fix the error.
    const handleLocationError = useCallback(
      (error) => {
        // If error code is 1 (User denied Geolocation), show Snackbar with instructions to enable it again
        if (error.code === 1) {
          enqueueSnackbar(
            LOCATION_DENIED_SNACK_MESSAGE,
            LOCATION_DENIED_SNACK_OPTIONS
          );
        } else {
          enqueueSnackbar(
            `Kunde inte fastställa din plats. Felkod: ${error.code}. Detaljer: "${error.message}".`,
            {
              variant: "error",
            }
          );
        }
      },
      [enqueueSnackbar]
    );

    // This effect makes sure to subscribe to all events that could be sent on the local-observer.
    useEffect(() => {
      // We are submitting events on the local-observer when the geoLocation-api emits changes.
      // We have to catch the local-observer events and update the view accordingly.
      const changeListener = model.localObserver.subscribe(
        "geolocationChange",
        handleGeoLocationChange
      );

      // We are submitting events on the local-observer when the geoLocation is toggled off/on etc.
      // We have to catch the local-observer events and update the view accordingly.
      const statusListener = model.localObserver.subscribe(
        "locationStatus",
        handleStatusChange
      );

      // We are submitting events on the local-observer if the geoLocation-api encounters some
      // kind of error (for example if the user has denied use of location in the browser). These
      // are caught here.
      const errorListener = model.localObserver.subscribe(
        "geolocationError",
        handleLocationError
      );

      // We have to make sure to clean up all listeners on eventual effect trigger.
      return () => {
        changeListener.unsubscribe();
        statusListener.unsubscribe();
        errorListener.unsubscribe();
      };
    }, [
      model,
      handleGeoLocationChange,
      handleStatusChange,
      handleLocationError,
    ]);

    return (
      <HajkToolTip title={tooltip}>
        <StyledPaper>
          <StyledToggleButton
            aria-label={defaultTooltip}
            onClick={onClick}
            value="check"
            selected={selected}
            onChange={() => {
              selected ? model.disable() : model.enable();
              setSelected(!selected);
            }}
          >
            {currentIcon}
          </StyledToggleButton>
        </StyledPaper>
      </HajkToolTip>
    );
  }
);

export default CustomControlButtonView;
