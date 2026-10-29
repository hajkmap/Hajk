import i18n from "src/i18n";

export const DEFAULT_MEASUREMENT_SETTINGS = Object.freeze({
  showText: true,
  showArea: true,
  showLength: true,
  showPerimeter: true,
  areaUnit: "AUTO",
  lengthUnit: "AUTO",
  precision: 1,
  pointPrecision: 0,
});

export const MEASUREMENT_PRECISIONS = [
  {
    value: 0,
    // Getter, so the text is translated when read
    get name() {
      return i18n.t("common.decimals", { count: 0 });
    },
  },
  {
    value: 1,
    // Getter, so the text is translated when read
    get name() {
      return i18n.t("common.decimals", { count: 1 });
    },
  },
  {
    value: 2,
    // Getter, so the text is translated when read
    get name() {
      return i18n.t("common.decimals", { count: 2 });
    },
  },
  {
    value: 3,
    // Getter, so the text is translated when read
    get name() {
      return i18n.t("common.decimals", { count: 3 });
    },
  },
];

export const STORAGE_KEY = "measurer";
