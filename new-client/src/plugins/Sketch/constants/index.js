import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import FormatShapesIcon from "@mui/icons-material/FormatShapes";
import OpenWithIcon from "@mui/icons-material/OpenWith";
import SaveIcon from "@mui/icons-material/Save";
import ImportExportIcon from "@mui/icons-material/ImportExport";
import SettingsIcon from "@mui/icons-material/Settings";

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

export const MAX_REMOVED_FEATURES = 4;
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
export const MAX_SKETCHES = 3;

export const DEFAULT_MEASUREMENT_SETTINGS = {
  showText: false,
  showArea: false,
  showLength: false,
  showPerimeter: false,
  areaUnit: "AUTO",
  lengthUnit: "AUTO",
  precision: 0,
};

export const STORAGE_KEY = "sketch";

// How many characters we allow the user to save in LS.
export const MAX_LS_CHARS = 1e6;

export const PROMPT_TEXTS = {
  saveOverflow: "Objekten kunde inte sparas. Arbetsytan för många objekt.",
  saveNoFeatures: "Kunde inte skapa arbetsyta, inga ritobjekt hittades.",
  saveSuccess: "Arbetsytan sparades utan problem.",
  CircleHelp:
    "Du kan skapa en cirkel genom att klicka med en bestämd radie, eller dra för att få en önskad radie.",
  LineStringHelp:
    "Skapa linjer genom att klicka på en position för varje nod, avsluta med dubbelklick.",
  RectangleHelp:
    "Skapa en rektangel genom att hålla vänsterklick med musen och dra över en yta för att få en önskad storlek.",
  ArrowHelp:
    "En pil skapas genom att klicka på en position för varje nod, avsluta med dubbelklick.",
  SelectHelp:
    "Klicka på ett existerande objekt i kartan och kopiera in det i ritlagret.",
  PolygonHelp:
    "Skapa en polygon genom att klicka på en position för varje nod, avsluta med dubbelklick.",
  PointHelp: "Klicka på en position för att infoga en punkt.",
  TextHelp: "Klicka på en position för att infoga text.",
  EDITHelp: "Klicka på ett objekt för att redigera dess utseende.",
  MOVEHelp: "Klicka på ett objekt för att förflytta det.",
  DELETEHelp: "Klicka på ett objekt för att radera det från din skiss.",
  SAVEHelp:
    "Här kan du spara en arbetsyta för att fortsätta ditt arbete senare. För att spara över en äldre arbetsyta, ange samma namn.",
};

export const AREA_MEASUREMENT_UNITS = [
  { type: "AUTO", name: "Automatisk" },
  { type: "M2", name: "Kvadratmeter (m²)" },
  { type: "KM2", name: "Kvadratkilometer (km²)" },
  { type: "HECTARE", name: "Hektar (ha)" },
];

export const LENGTH_MEASUREMENT_UNITS = [
  { type: "AUTO", name: "Automatisk" },
  { type: "M", name: "Meter (m)" },
  { type: "KM", name: "Kilometer (km)" },
];

export const MEASUREMENT_PRECISIONS = [
  { value: 0, name: "0 decimaler" },
  { value: 1, name: "1 decimal" },
  { value: 2, name: "2 decimaler" },
  { value: 3, name: "3 decimaler" },
];

export const DEFAULT_DRAW_STYLE_SETTINGS = {
  strokeColor: { r: 10, g: 10, b: 10, a: 1 },
  fillColor: { r: 60, g: 60, b: 60, a: 0.3 },
  strokeType: "solid",
  strokeWidth: 1,
};

export const DEFAULT_TEXT_STYLE_SETTINGS = {
  foregroundColor: "#FFFFFF",
  backgroundColor: "#000000",
  size: 14,
};
