import AddIcon from "@material-ui/icons/Add";
import DeleteIcon from "@material-ui/icons/Delete";
import DirectionsIcon from "@material-ui/icons/Directions";
import CreateIcon from "@material-ui/icons/Create";
import ImportExportIcon from "@material-ui/icons/ImportExport";
import SettingsIcon from "@material-ui/icons/Settings";

export const ACTIVITIES = [
  {
    id: "ADD",
    tooltip: "Lägg till nya objekt.",
    information:
      "Lägg till objekt genom att rita i kartan. Börja med att välja vilken typ av objekt du vill rita nedan.",
    icon: <AddIcon />,
  },
  {
    id: "EDIT",
    tooltip: "Redigera existerande objekt.",
    information:
      "Redigera objekt du ritat tidigare genom att flytta noder, eller ändra färg.",
    icon: <CreateIcon />,
  },
  {
    id: "MOVE",
    tooltip: "Flytta existerande objekt.",
    information:
      'Klicka på det objekt i kartan som du vill flytta för att aktivera "flytt-läge". Dra sedan objektet till rätt plats.',
    icon: <DirectionsIcon />,
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
    tooltip: "Spara eller ladda upp ritade objekt.",
    information:
      "Behöver du ta en paus? Spara det du har ritat och fortsätt senare.",
    icon: <ImportExportIcon />,
  },
  {
    id: "SETTINGS",
    tooltip: "Ändra färg, linjebredd, etc.",
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
    type: "Polygon",
    label: "Yta",
    tooltip:
      "Rita en yta i kartan genom att klicka en gång per nod, avlsuta med ett dubbelklick.",
  },
  {
    type: "Line",
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
    type: "Circle",
    label: "Cirkel",
    tooltip:
      "Rita en cikel i kartan genom att klicka en gång där cikeln ska börja, dra sedan till önskad storlek och släpp.",
  },
  {
    type: "Arrow",
    label: "Pil",
    tooltip:
      "Rita en pil i kartan genom att klicka en gång per nod, avlsuta med ett dubbelklick.",
  },
  {
    type: "Select",
    label: "Välj i kartan",
    tooltip:
      "Välj ett objekt från befintliga objekt i kartan och importera detta till din ritning.",
  },
  {
    type: "Text",
    label: "Text",
    tooltip: "Infoga text i kartan genom att klicka där du vill ha texten.",
  },
];
export const PLUGIN_MARGIN = 10;

export const STROKE_DASHES = [
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
