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
  { value: 0, name: "0 decimaler" },
  { value: 1, name: "1 decimal" },
  { value: 2, name: "2 decimaler" },
  { value: 3, name: "3 decimaler" },
];

export const STORAGE_KEY = "measurer";
