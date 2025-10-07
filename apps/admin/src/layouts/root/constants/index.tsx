import MapIcon from "@mui/icons-material/Map";
import LayersIcon from "@mui/icons-material/Layers";
import HandymanIcon from "@mui/icons-material/Handyman";
import CollectionsIcon from "@mui/icons-material/Collections";
import NetworkPingIcon from "@mui/icons-material/NetworkPing";
import DynamicFormIcon from "@mui/icons-material/DynamicForm";
import GroupIcon from "@mui/icons-material/Group";
import Diversity2Icon from "@mui/icons-material/Diversity2";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PersonIcon from "@mui/icons-material/Person";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import ExampleIcon from "@mui/icons-material/Code";
import StorageIcon from "@mui/icons-material/Storage";

export const HEADER_HEIGHT = 64;
export const HEADER_Z_INDEX = 1001;
export const SIDEBAR_Z_INDEX = 1000;
export const SIDEBAR_WIDTH = 280;
export const SIDEBAR_MINI_WIDTH = 58;

export const SIDEBAR_MENU = [
  {
    to: "",
    titleKey: "navBar.general",
    collapsible: true,
    icon: <DashboardIcon />,
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
        to: "/groups",
        titleKey: "common.layerGroups",
        icon: <CollectionsIcon />,
      },
    ],
  },
  {
    to: "",
    titleKey: "navBar.servicesAndLayers",
    collapsible: true,
    icon: <LayersIcon />,
    subItems: [
      {
        to: "/services",
        titleKey: "navBar.servicesAndLayers.serviceDefinitions",
        icon: <NetworkPingIcon />,
      },
      {
        to: "/search-layers",
        titleKey: "navBar.servicesAndLayers.searchLayers",
        icon: <LayersIcon />,
      },
      {
        to: "/editing-layers",
        titleKey: "navBar.servicesAndLayers.editingLayers",
        icon: <LayersIcon />,
      },
      {
        to: "/display-layers",
        titleKey: "navBar.servicesAndLayers.displayLayers",
        icon: <LayersIcon />,
      },
    ],
  },
  {
    to: "",
    titleKey: "navBar.user",
    collapsible: true,
    icon: <PersonIcon />,
    subItems: [
      {
        to: "/users",
        titleKey: "common.users",
        icon: <GroupIcon />,
      },
      {
        to: "/user-roles",
        titleKey: "common.userRoles",
        icon: <Diversity2Icon />,
      },
    ],
  },
  {
    to: "",
    titleKey: "navBar.other",
    collapsible: true,
    icon: <MoreHorizIcon />,
    subItems: [
      {
        to: "/form-factory",
        titleKey: "Form factory",
        icon: <DynamicFormIcon />,
      },
      {
        to: "/examples",
        titleKey: "Form examples",
        icon: <ExampleIcon />,
      },
      {
        to: "/database",
        titleKey: "common.database",
        icon: <StorageIcon />,
      },
    ],
  },
];
