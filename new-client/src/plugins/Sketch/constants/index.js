import CreateIcon from "@material-ui/icons/Create";
import ImportExportIcon from "@material-ui/icons/ImportExport";

export const TABS = [
  {
    tooltip: "Lägg till, redigera, eller ta bort objekt från kartan.",
    label: "Rita",
    icon: <CreateIcon />,
  },
  {
    tooltip: "Spara ritade objekt i webbläsaren eller till en fil.",
    label: "Spara",
    icon: <ImportExportIcon />,
  },
];

export const PLUGIN_MARGIN = 10;
