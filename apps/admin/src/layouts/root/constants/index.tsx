import MapIcon from "@mui/icons-material/Map";
import LayersIcon from "@mui/icons-material/Layers";
import HandymanIcon from "@mui/icons-material/Handyman";
import CollectionsIcon from "@mui/icons-material/Collections";
import NetworkPingIcon from "@mui/icons-material/NetworkPing";
import DynamicFormIcon from "@mui/icons-material/DynamicForm";

export const HEADER_HEIGHT = 64;
export const HEADER_Z_INDEX = 1001;
export const SIDEBAR_Z_INDEX = 1000;
export const SIDEBAR_WIDTH = 250;
export const SIDEBAR_MINI_WIDTH = 58;

export const SIDEBAR_MENU = [
  {
    to: "",
    titleKey: "common.mapSettings",
    collapsible: true,
    icon: <MapIcon />,
    subItems: [
      {
        to: "/maps",
        titleKey: "common.maps",
        icon: <MapIcon />,
      },
      {
        to: "/tools",
        titleKey: "common.tools",
        icon: <HandymanIcon />,
      },
      {
        to: "/services",
        titleKey: "common.services",
        icon: <NetworkPingIcon />,
      },
      {
        to: "/layers",
        titleKey: "common.layers",
        icon: <LayersIcon />,
      },
      {
        to: "/groups",
        titleKey: "common.layerGroups",
        icon: <CollectionsIcon />,
      },
    ],
  },
  {
    to: "",
    titleKey: "common.userSettings",
    collapsible: true,
    icon: <MapIcon />,
    subItems: [
      {
        to: "/users",
        titleKey: "common.users",
        icon: <DynamicFormIcon />,
      },
      {
        to: "/user-roles",
        titleKey: "common.userRoles",
        icon: <DynamicFormIcon />,
      },
    ],
  },
  {
    to: "",
    titleKey: "common.other",
    collapsible: true,
    icon: <MapIcon />,
    subItems: [
      {
        to: "/form-factory",
        titleKey: "Form factory",
        icon: <DynamicFormIcon />,
      },
    ],
  },
];
