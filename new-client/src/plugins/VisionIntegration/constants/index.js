import HomeIcon from "@mui/icons-material/Home";
import PlaceIcon from "@mui/icons-material/Place";
import EditIcon from "@mui/icons-material/Edit";

// Enum for possible hub-connection-status
export const HUB_CONNECTION_STATUS = Object.freeze({
  LOADING: "LOADING",
  FAILED: "FAILED",
  SUCCESS: "SUCCESS",
});

export const INTEGRATION_IDS = Object.freeze({
  ESTATES: "ESTATES",
  COORDINATES: "COORDINATES",
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
    id: INTEGRATION_IDS.EDIT,
    icon: <EditIcon />,
    label: "Redigera",
    tooltip:
      "Redigera och skapa nya ytor som kan kopplas till objekt i Vision. Denna funktion är ännu inte implementerad.",
    disabled: true,
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
