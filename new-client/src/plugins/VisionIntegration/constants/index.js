import HomeIcon from "@mui/icons-material/Home";
import PlaceIcon from "@mui/icons-material/Place";
import YardIcon from "@mui/icons-material/Yard";

// Enum for possible hub-connection-status
export const HUB_CONNECTION_STATUS = Object.freeze({
  LOADING: "LOADING",
  FAILED: "FAILED",
  SUCCESS: "SUCCESS",
});

export const INTEGRATION_IDS = Object.freeze({
  ESTATES: "ESTATES",
  COORDINATES: "COORDINATES",
  ENVIRONMENT: "ENVIRONMENT",
});

export const ESTATE_TEXT = Object.freeze({
  NO_SELECTED_ESTATES_HEADER: "Det finns inga selekterade fastigheter",
  SELECTED_ESTATES_HEADER: "Selekterade fastigheter",
  NO_SELECTED_ESTATES_HELP:
    "Selektera fastigheter genom att aktivera selektering och klicka på fastigheter i kartan.",
  SELECTED_ESTATES_HELP:
    "De selekterade fastigheterna kan nu hämtas från Vision",
});

export const TABS = [
  {
    id: INTEGRATION_IDS.ESTATES,
    icon: <HomeIcon />,
    label: "Fastigheter",
    tooltip: "Skicka fastigheter mellan Vision och kartan.",
    disabled: false,
  },
  {
    id: INTEGRATION_IDS.COORDINATES,
    icon: <PlaceIcon />,
    label: "Koordinater",
    tooltip: "Skicka koordinater mellan Vision och kartan.",
    disabled: false,
  },
  {
    id: INTEGRATION_IDS.ENVIRONMENT,
    icon: <YardIcon />,
    label: "Markmiljö",
    tooltip:
      "Skicka områden, undersökningar, och föroreningar mellan Vision och kartan.",
    disabled: false,
  },
];

export const ENVIRONMENT_IDS = Object.freeze({
  AREA: 1,
  INVESTIGATION: 2,
  POLLUTION: 3,
});

export const ENVIRONMENT_INFO = [
  {
    id: ENVIRONMENT_IDS.POLLUTION,
    name: "Föroreningar",
    layerText: "Föroreningslager",
  },
  {
    id: ENVIRONMENT_IDS.AREA,
    name: "Områden",
    layerText: "Områdeslager",
  },
  {
    id: ENVIRONMENT_IDS.INVESTIGATION,
    name: "Undersökningar",
    layerText: "Undersökningslager",
  },
];

export const DEFAULT_DRAW_SETTINGS = {
  showText: true,
  showArea: false,
  showLength: false,
  showPerimeter: false,
  areaUnit: "AUTO",
  lengthUnit: "AUTO",
  precision: 0,
};

export const DEFAULT_DRAW_STYLE_SETTINGS = {
  strokeColor: "rgba(41,51,242,0.8)",
  strokeDash: null,
  strokeWidth: 2,
  fillColor: "rgba(255,255,255,0.07)",
};

export const MAP_INTERACTIONS = Object.freeze({
  SELECT_ESTATE: "SELECT_ESTATE",
  SELECT_COORDINATE: "SELECT_COORDINATE",
  SELECT_ENVIRONMENT: "SELECT_ENVIRONMENT",
});
