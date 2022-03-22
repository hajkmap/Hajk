import DeleteIcon from "@material-ui/icons/Delete";
import FormatShapesIcon from "@material-ui/icons/FormatShapes";
import OpenWithIcon from "@material-ui/icons/OpenWith";
import EditIcon from "@material-ui/icons/Edit";
import SaveIcon from "@material-ui/icons/Save";
import ImportExportIcon from "@material-ui/icons/ImportExport";
import SettingsIcon from "@material-ui/icons/Settings";

export const ACTIVITIES = [
  {
    id: "ADD",
    tooltip: "Lägg till nya objekt.",
    information:
      "Lägg till objekt genom att rita i kartan. Börja med att välja vilken typ av objekt du vill rita nedan.",
    icon: <EditIcon />,
  },
  {
    id: "EDIT",
    tooltip: "Redigera existerande objekt.",
    information:
      "Redigera objekt du ritat tidigare genom att flytta noder, eller ändra färg.",
    icon: <FormatShapesIcon />,
  },
  {
    id: "MOVE",
    tooltip: "Flytta existerande objekt.",
    information:
      'Klicka på det objekt i kartan som du vill flytta för att aktivera "flytt-läge". Dra sedan objektet till rätt plats.',
    icon: <OpenWithIcon />,
  },
  {
    id: "DELETE",
    tooltip: "Ta bort objekt.",
    information:
      "Klicka på det rit-objekt som du vill ta bort, eller klicka på knappen nedan för att ta bort alla rit-objekt.",
    icon: <DeleteIcon />,
  },
  {
    id: "SAVE",
    tooltip: "Spara ritade objekt.",
    information:
      "Behöver du ta en paus? Spara det du har ritat och fortsätt senare. Tänk på att enbart de objekt som syns i kartan sparas.",
    icon: <SaveIcon />,
  },
  {
    id: "UPLOAD",
    tooltip: "Ladda ned eller ladda upp ritade objekt.",
    information:
      "Importera eller exportera ritobjekt i .kml-format. Använd knapparna nedan, eller dra in en .KML-fil direkt till kartan.",
    icon: <ImportExportIcon />,
  },
  {
    id: "SETTINGS",
    tooltip: "Ändra om objektens mått ska synas etc.",
    information: "Här kan du ändra verktygets inställningar.",
    icon: <SettingsIcon />,
  },
];

export const DRAW_COLORS = [
  "#FF6900",
  "#FCB900",
  "#7BDCB5",
  "#00D084",
  "#8ED1FC",
  "#0693E3",
  "#ABB8C3",
  "#EB144C",
  "#F78DA7",
  "#9900EF",
  "#354FAD",
];

export const DRAW_TYPES = [
  {
    type: "Circle",
    label: "Cirkel",
    tooltip:
      "Rita en cikel i kartan genom att klicka en gång där cikeln ska börja, dra sedan till önskad storlek och släpp.",
  },
  {
    type: "LineString",
    label: "Linje",
    tooltip:
      "Rita en linje i kartan genom att klicka en gång per nod, avlsuta med ett dubbelklick.",
  },
  {
    type: "Rectangle",
    label: "Rektangel",
    tooltip:
      "Rita en rektangel i kartan genom att klicka en gång där rektangeln ska börja, dra sedan till önskad storlek och släpp.",
  },
  {
    type: "Arrow",
    label: "Pil",
    tooltip:
      "Rita en pil i kartan genom att klicka en gång per nod, avlsuta med ett dubbelklick.",
  },
  {
    type: "Polygon",
    label: "Polygon",
    tooltip:
      "Rita en polygon i kartan genom att klicka en gång per nod, avlsuta med ett dubbelklick.",
  },
  {
    type: "Point",
    label: "Punkt",
    tooltip:
      "Infoga en punkt i kartan genom att klicka där du vill ha punkten.",
  },
  {
    type: "Text",
    label: "Text",
    tooltip: "Infoga text i kartan genom att klicka där du vill ha texten.",
  },
];

export const MAX_REMOVED_FEATURES = 5;
export const PLUGIN_MARGIN = 10;

export const STROKE_TYPES = [
  {
    type: "solid",
    label: "Heldragen",
    tooltip: "Heldragen linje.",
  },
  {
    type: "dotted",
    label: "Punktad",
    tooltip: "Punktad linje.",
  },
  {
    type: "dashed",
    label: "Streckad",
    tooltip: "Streckad linje.",
  },
];

export const STROKE_DASHES = new Map([
  ["solid", null],
  ["dotted", [2, 7]],
  ["dashed", [12, 7]],
]);

// A constant stating how many sketches we're allowed to save in local-storage.
export const MAX_SKETCHES = 4;

export const DEFAULT_MEASUREMENT_SETTINGS = {
  showText: false,
  showArea: false,
  showPerimeter: false,
  areaUnit: "AUTO",
  lengthUnit: "AUTO",
};

export const STORAGE_KEY = "sketch";

// How many characters we allow the user to save in LS.
export const MAX_LS_CHARS = 1e6;

export const PROMPT_TEXTS = {
  saveOverflow: "Objekten kunde inte sparas. Arbetsytan för många objekt.",
  saveNoFeatures: "Kunde inte skapa arbetsyta, inga ritobjekt hittades.",
  saveSuccess: "Arbetsytan sparades utan problem.",
};

export const AREA_MEASUREMENT_UNITS = [
  { type: "AUTO", name: "Automatisk" },
  { type: "M2", name: "m²" },
  { type: "KM2", name: "km²" },
  { type: "HECTARE", name: "Hektar" },
];

export const LENGTH_MEASUREMENT_UNITS = [
  { type: "AUTO", name: "Automatisk" },
  { type: "M", name: "m" },
  { type: "KM", name: "km" },
];
