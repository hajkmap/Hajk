export const DEFAULT_PRINT_OPTIONS = Object.freeze({
  scales: [200, 400, 1000, 2000, 5000, 10000, 25000, 50000, 100000, 200000],
  scaleMeters: [20, 40, 40, 100, 200, 200, 400, 600, 2000, 4000, 10000, 20000],
  includeScaleBar: true,
  scaleBarPlacement: "bottomLeft",
});

export const PRINT_STATUS = Object.freeze({
  IDLE: "IDLE",
  BUSY: "BUSY",
  ABORT: "ABORT",
  ERROR: "ERROR",
  SUCCESS: "SUCCESS",
});

export const MAX_IMAGES_FOR_PRINT = 100;

export const PRINT_ENABLED_TOOLTIP = "Starta utskriften";
export const PRINT_DISABLED_TOOLTIP =
  "Nuvarande inställningar gör att för många bilder kommer skrivas ut. Minska datumintervallet eller ändra upplösningen. ";
