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
