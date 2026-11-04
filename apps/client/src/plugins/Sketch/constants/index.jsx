import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import FormatShapesIcon from "@mui/icons-material/FormatShapes";
import OpenWithIcon from "@mui/icons-material/OpenWith";
import SaveIcon from "@mui/icons-material/Save";
import ImportExportIcon from "@mui/icons-material/ImportExport";
import SettingsIcon from "@mui/icons-material/Settings";
import AddLocationAltIcon from "@mui/icons-material/AddLocationAlt";
import i18n from "src/i18n";

// Texts are getters, so they are translated when read (this module is also
// imported at startup, before the language is resolved).
export const ACTIVITIES = [
  {
    id: "ADD",
    get tooltip() {
      return i18n.t("sketch.activities.ADD.tooltip");
    },
    get information() {
      return i18n.t("sketch.activities.ADD.information");
    },
    icon: <EditIcon />,
  },
  {
    id: "EDIT",
    get tooltip() {
      return i18n.t("sketch.activities.EDIT.tooltip");
    },
    get information() {
      return i18n.t("sketch.activities.EDIT.information");
    },
    icon: <FormatShapesIcon />,
  },
  {
    id: "MOVE",
    get tooltip() {
      return i18n.t("sketch.activities.MOVE.tooltip");
    },
    get information() {
      return i18n.t("sketch.activities.MOVE.information");
    },
    icon: <OpenWithIcon />,
  },
  {
    id: "DELETE",
    get tooltip() {
      return i18n.t("sketch.activities.DELETE.tooltip");
    },
    get information() {
      return i18n.t("sketch.activities.DELETE.information");
    },
    icon: <DeleteIcon />,
  },
  {
    id: "SAVE",
    get tooltip() {
      return i18n.t("sketch.activities.SAVE.tooltip");
    },
    get information() {
      return i18n.t("sketch.activities.SAVE.information");
    },
    icon: <SaveIcon />,
  },
  {
    id: "UPLOAD",
    get tooltip() {
      return i18n.t("sketch.activities.UPLOAD.tooltip");
    },
    get information() {
      return i18n.t("sketch.activities.UPLOAD.information");
    },
    icon: <ImportExportIcon />,
  },
  {
    id: "SETTINGS",
    get tooltip() {
      return i18n.t("sketch.activities.SETTINGS.tooltip");
    },
    get information() {
      return i18n.t("sketch.activities.SETTINGS.information");
    },
    icon: <SettingsIcon />,
  },
  {
    id: "OGC",
    get tooltip() {
      return i18n.t("sketch.activities.OGC.tooltip");
    },
    get information() {
      return i18n.t("sketch.activities.OGC.information");
    },
    icon: <AddLocationAltIcon />,
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
  "#000000",
  "#FFFFFF",
];

export const DRAW_TYPES = [
  {
    type: "Circle",
    get label() {
      return i18n.t("sketch.drawTypes.Circle.label");
    },
    get tooltip() {
      return i18n.t("sketch.drawTypes.Circle.tooltip");
    },
  },
  {
    type: "LineString",
    get label() {
      return i18n.t("sketch.drawTypes.LineString.label");
    },
    get tooltip() {
      return i18n.t("sketch.drawTypes.LineString.tooltip");
    },
  },
  {
    type: "Rectangle",
    get label() {
      return i18n.t("sketch.drawTypes.Rectangle.label");
    },
    get tooltip() {
      return i18n.t("sketch.drawTypes.Rectangle.tooltip");
    },
  },
  {
    type: "Arrow",
    get label() {
      return i18n.t("sketch.drawTypes.Arrow.label");
    },
    get tooltip() {
      return i18n.t("sketch.drawTypes.Arrow.tooltip");
    },
  },
  {
    type: "Select",
    get label() {
      return i18n.t("sketch.drawTypes.Select.label");
    },
    get tooltip() {
      return i18n.t("sketch.drawTypes.Select.tooltip");
    },
  },
  {
    type: "Polygon",
    get label() {
      return i18n.t("sketch.drawTypes.Polygon.label");
    },
    get tooltip() {
      return i18n.t("sketch.drawTypes.Polygon.tooltip");
    },
  },
  {
    type: "Point",
    get label() {
      return i18n.t("sketch.drawTypes.Point.label");
    },
    get tooltip() {
      return i18n.t("sketch.drawTypes.Point.tooltip");
    },
  },
  {
    type: "Text",
    get label() {
      return i18n.t("sketch.drawTypes.Text.label");
    },
    get tooltip() {
      return i18n.t("sketch.drawTypes.Text.tooltip");
    },
  },
];

export const ROTATABLE_DRAW_TYPES = [
  "Polygon",
  "MultiPolygon",
  "Rectangle",
  "LineString",
];

export const MAX_REMOVED_FEATURES = 4;
export const PLUGIN_MARGIN = 10;

export const STROKE_TYPES = [
  {
    type: "none",
    get label() {
      return i18n.t("sketch.strokeTypes.none.label");
    },
    get tooltip() {
      return i18n.t("sketch.strokeTypes.none.tooltip");
    },
  },
  {
    type: "solid",
    get label() {
      return i18n.t("sketch.strokeTypes.solid.label");
    },
    get tooltip() {
      return i18n.t("sketch.strokeTypes.solid.tooltip");
    },
  },
  {
    type: "dotted",
    get label() {
      return i18n.t("sketch.strokeTypes.dotted.label");
    },
    get tooltip() {
      return i18n.t("sketch.strokeTypes.dotted.tooltip");
    },
  },
  {
    type: "dashed",
    get label() {
      return i18n.t("sketch.strokeTypes.dashed.label");
    },
    get tooltip() {
      return i18n.t("sketch.strokeTypes.dashed.tooltip");
    },
  },
];

export const STROKE_DASHES = new Map([
  ["none", [null, null]],
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
  pointPrecision: 0,
};

export const SNAP_TOLERANCE_OPTIONS = [
  {
    value: 4,
    get name() {
      return i18n.t("sketch.pixels", { count: 4 });
    },
  },
  {
    value: 6,
    get name() {
      return i18n.t("sketch.pixels", { count: 6 });
    },
  },
  {
    value: 8,
    get name() {
      return i18n.t("sketch.pixels", { count: 8 });
    },
  },
  {
    value: 10,
    get name() {
      return i18n.t("sketch.pixels", { count: 10 });
    },
  },
  {
    value: 12,
    get name() {
      return i18n.t("sketch.pixels", { count: 12 });
    },
  },
  {
    value: 15,
    get name() {
      return i18n.t("sketch.pixels", { count: 15 });
    },
  },
];

export const DEFAULT_SNAP_SETTINGS = {
  snapEnabled: true,
  snapTolerance: 10,
};

export const STORAGE_KEY = "sketch";

// How many characters we allow the user to save in LS.
export const MAX_LS_CHARS = 1e6;

export const PROMPT_TEXTS = {
  get saveOverflow() {
    return i18n.t("sketch.prompts.saveOverflow");
  },
  get saveNoFeatures() {
    return i18n.t("sketch.prompts.saveNoFeatures");
  },
  get saveSuccess() {
    return i18n.t("sketch.prompts.saveSuccess");
  },
  get CircleHelp() {
    return i18n.t("sketch.prompts.CircleHelp");
  },
  get LineStringHelp() {
    return i18n.t("sketch.prompts.LineStringHelp");
  },
  get RectangleHelp() {
    return i18n.t("sketch.prompts.RectangleHelp");
  },
  get ArrowHelp() {
    return i18n.t("sketch.prompts.ArrowHelp");
  },
  get SelectHelp() {
    return i18n.t("sketch.prompts.SelectHelp");
  },
  get PolygonHelp() {
    return i18n.t("sketch.prompts.PolygonHelp");
  },
  get PointHelp() {
    return i18n.t("sketch.prompts.PointHelp");
  },
  get TextHelp() {
    return i18n.t("sketch.prompts.TextHelp");
  },
  get MultiDrawHelp() {
    return i18n.t("sketch.prompts.MultiDrawHelp");
  },
  get EDITHelp() {
    return i18n.t("sketch.prompts.EDITHelp");
  },
  get MOVEHelp() {
    return i18n.t("sketch.prompts.MOVEHelp");
  },
  get DELETEHelp() {
    return i18n.t("sketch.prompts.DELETEHelp");
  },
  get SAVEHelp() {
    return i18n.t("sketch.prompts.SAVEHelp");
  },
  get OGCHelp() {
    return i18n.t("sketch.prompts.OGCHelp");
  },
};

export const AREA_MEASUREMENT_UNITS = [
  {
    type: "AUTO",
    get name() {
      return i18n.t("sketch.units.AUTO");
    },
  },
  {
    type: "M2",
    get name() {
      return i18n.t("sketch.units.M2");
    },
  },
  {
    type: "KM2",
    get name() {
      return i18n.t("sketch.units.KM2");
    },
  },
  {
    type: "HECTARE",
    get name() {
      return i18n.t("sketch.units.HECTARE");
    },
  },
];

export const LENGTH_MEASUREMENT_UNITS = [
  {
    type: "AUTO",
    get name() {
      return i18n.t("sketch.units.AUTO");
    },
  },
  {
    type: "M",
    get name() {
      return i18n.t("sketch.units.M");
    },
  },
  {
    type: "KM",
    get name() {
      return i18n.t("sketch.units.KM");
    },
  },
];

export const MEASUREMENT_PRECISIONS = [
  {
    value: 0,
    get name() {
      return i18n.t("common.decimals", { count: 0 });
    },
  },
  {
    value: 1,
    get name() {
      return i18n.t("common.decimals", { count: 1 });
    },
  },
  {
    value: 2,
    get name() {
      return i18n.t("common.decimals", { count: 2 });
    },
  },
  {
    value: 3,
    get name() {
      return i18n.t("common.decimals", { count: 3 });
    },
  },
];

export const DEFAULT_DRAW_STYLE_SETTINGS = {
  strokeColor: { r: 10, g: 10, b: 10, a: 1 },
  fillColor: { r: 60, g: 60, b: 60, a: 0.3 },
  strokeType: "solid",
  strokeWidth: 1,
  radius: 6,
};

export const DEFAULT_TEXT_STYLE_SETTINGS = {
  foregroundColor: "#FFFFFF",
  backgroundColor: "#000000",
  size: 14,
};
