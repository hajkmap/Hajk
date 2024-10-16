import HomeIcon from "@mui/icons-material/Home";
import MapIcon from "@mui/icons-material/Map";
import LayersIcon from "@mui/icons-material/Layers";
import HandymanIcon from "@mui/icons-material/Handyman";
import CollectionsIcon from "@mui/icons-material/Collections";
import NetworkPingIcon from "@mui/icons-material/NetworkPing";

export const HEADER_HEIGHT = 64;
export const HEADER_Z_INDEX = 1001;
export const SIDEBAR_Z_INDEX = 1000;
export const SIDEBAR_WIDTH = 250;
export const SIDEBAR_MINI_WIDTH = 58;

export const SIDEBAR_MENU = [
  {
    to: "/",
    titleKey: "common.home",
    icon: <HomeIcon />,
  },
  {
    to: "/maps",
    titleKey: "common.maps",
    icon: <MapIcon />,
  },
  {
    to: "/layers",
    titleKey: "common.layers",
    icon: <LayersIcon />,
  },
  {
    to: "/groups",
    titleKey: "common.groups",
    icon: <CollectionsIcon />,
  },
  {
    to: "/services",
    titleKey: "common.services",
    icon: <NetworkPingIcon />,
  },
  {
    to: "/tools",
    titleKey: "common.tools",
    icon: <HandymanIcon />,
  },
];
