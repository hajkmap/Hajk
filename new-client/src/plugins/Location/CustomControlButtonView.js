import React, { useEffect } from "react";
import { useSnackbar } from "notistack";

import { Paper, Tooltip } from "@mui/material";
import { styled } from "@mui/material/styles";
import ToggleButton from "@mui/material/ToggleButton";
import CircularProgress from "@mui/material/CircularProgress";
import LocationSearchingIcon from "@mui/icons-material/LocationSearching";
import LocationDisabledIcon from "@mui/icons-material/LocationDisabled";
import MyLocationIcon from "@mui/icons-material/MyLocation";

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

const CustomControlButtonView = React.memo((props) => {
  const { onClick, title, abstract, model } = props;

  const { enqueueSnackbar } = useSnackbar();
  const [selected, setSelected] = React.useState(false);
  const [currentIcon, setCurrentIcon] = React.useState(
    <LocationSearchingIcon />
  );

  // Save the original tooltip for later - we will want to
  // reset when user disables tracking
  const originalTooltip = `${title}: ${abstract}`;
  const [tooltip, setTooltip] = React.useState(originalTooltip);

  useEffect(() => {
    model.localObserver.subscribe("geolocationChange", (rawData) => {
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
    });

    model.localObserver.subscribe("locationStatus", (status) => {
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
          setTooltip(originalTooltip);
          break;
      }
    });

    model.localObserver.subscribe("geolocationError", (error) => {
      enqueueSnackbar(
        `Kunde inte fastställa din plats. Felkod: ${error.code}. Detaljer: "${error.message}".`,
        {
          variant: "error",
        }
      );
    });
  }, [model, enqueueSnackbar, originalTooltip]);

  return (
    <Tooltip disableInteractive title={tooltip}>
      <StyledPaper>
        <StyledToggleButton
          aria-label={title}
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
    </Tooltip>
  );
});

export default CustomControlButtonView;
