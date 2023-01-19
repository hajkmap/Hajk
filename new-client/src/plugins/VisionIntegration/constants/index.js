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
  EDIT: "EDIT",
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
  EDIT_NONE: "EDIT_NONE",
  EDIT_CREATE_POLYGON: "EDIT_CREATE_POLYGON",
  EDIT_SELECT_FROM_LAYER: "EDIT_SELECT_FROM_LAYER",
  EDIT_MODIFY: "EDIT_MODIFY",
});

export const MAP_INTERACTION_INFO = [
  {
    id: MAP_INTERACTIONS.SELECT_ESTATE,
    name: "Selektera fastighet",
    helperText:
      "Klicka på fastigheterna som du vill välja. Om du håller in CTRL så kan du rita ett område och välja flera fastigheter samtidigt.",
    useInEditView: false,
  },
  {
    id: MAP_INTERACTIONS.SELECT_COORDINATE,
    name: "Seletera koordinat",
    helperText: "Klicka där du vill placera en koordinat.",
    useInEditView: false,
  },
  {
    id: MAP_INTERACTIONS.SELECT_ENVIRONMENT,
    name: "Selektera markmiljö-objekt",
    helperText:
      "Klicka de objekt som du vill välja. Om du håller in CTRL så kan du rita ett område och välja flera objekt samtidigt.",
    useInEditView: false,
  },
  {
    id: MAP_INTERACTIONS.EDIT_NONE,
    name: "Välj verktyg",
    helperText: null,
    useInEditView: true,
  },
  {
    id: MAP_INTERACTIONS.EDIT_CREATE_POLYGON,
    name: "Rita yta",
    helperText:
      "Rita in en yta genom att klicka en gång per nod. Avsluta genom att dubbelklicka.",
    useInEditView: true,
  },
  {
    id: MAP_INTERACTIONS.EDIT_SELECT_FROM_LAYER,
    name: "Välj yta i kartan",
    helperText: "Välj en existerande yta i kartan genom att klicka på den.",
    useInEditView: true,
  },
  {
    id: MAP_INTERACTIONS.EDIT_MODIFY,
    name: "Redigera yta",
    helperText: "Redigera existerande yta genom att flytta dess noder.",
    useInEditView: true,
  },
];

export const EDIT_STATUS = {
  INACTIVE: "EDIT_INACTIVE",
  SEARCH_LOADING: "EDIT_SEARCH_LOADING",
  WAITING: "EDIT_WAITING",
  ACTIVE: "EDIT_ACTIVE",
};

export const EDIT_VIEW_TITLE = "Uppdatera geometri";

export const EDIT_VIEW_CAPTION =
  "Här kan du hantera det geometri-objekt som ska vara kopplat till Vision. När du är nöjd klickar du på 'spara' för att skicka informationen till Vision.";
