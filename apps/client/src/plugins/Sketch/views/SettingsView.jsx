import React from "react";
import {
  FormControl,
  FormLabel,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Switch,
} from "@mui/material";

import LocalStorageHelper from "../../../utils/LocalStorageHelper";
import useCookieStatus from "../../../hooks/useCookieStatus";
import HajkToolTip from "components/HajkToolTip";

import {
  STORAGE_KEY,
  AREA_MEASUREMENT_UNITS,
  LENGTH_MEASUREMENT_UNITS,
  MEASUREMENT_PRECISIONS,
  SNAP_TOLERANCE_OPTIONS,
} from "../constants";
import i18n from "src/i18n";
import { NO_SERVICE_LABEL } from "../../../buses/editBus";

const SettingsView = (props) => {
  // Let's destruct some props
  const {
    model,
    measurementSettings,
    setMeasurementSettings,
    showKinkMarkers,
    setShowKinkMarkers,
    map,
    ogcSource,
  } = props;
  // We're gonna need to keep track of if we're allowed to save stuff in LS. Let's use the hook.
  const { functionalCookiesOk } = useCookieStatus(props.globalObserver);
  // We're gonna need some local state as well. For example, should we show helper-snacks?
  const [showHelperSnacks, setShowHelperSnacks] = React.useState(
    model.getShowHelperSnacks()
  );

  // Get snap settings from localStorage or use defaults
  const getSnapSettings = React.useCallback(() => {
    if (!functionalCookiesOk) {
      return { snapEnabled: true, snapTolerance: 10 };
    }
    const saved = LocalStorageHelper.get(STORAGE_KEY);
    return {
      snapEnabled: saved?.snapEnabled ?? true,
      snapTolerance: saved?.snapTolerance ?? 10,
    };
  }, [functionalCookiesOk]);

  // State for snap settings
  const [snapEnabled, setSnapEnabled] = React.useState(
    () => getSnapSettings().snapEnabled
  );
  const [snapTolerance, setSnapTolerance] = React.useState(
    () => getSnapSettings().snapTolerance
  );

  const [showHajkToolTips, setShowHajkToolTips] = React.useState({
    select1: true,
    select2: true,
    select3: true,
    select4: true,
    select5: true,
    // Add more keys for additional Selects if needed
  });

  const handleFocus = (selectId, value) => {
    setShowHajkToolTips((prevStates) => ({
      ...prevStates,
      [selectId]: value,
    }));
  };
  // An effect that makes sure to update the model with the user-choice regarding the helper-snacks.
  // The effect also makes sure to store the setting in the LS (if allowed).
  React.useEffect(() => {
    model.setShowHelperSnacks(showHelperSnacks);
    if (functionalCookiesOk) {
      LocalStorageHelper.set(STORAGE_KEY, {
        ...LocalStorageHelper.get(STORAGE_KEY),
        showHelperSnacks: showHelperSnacks,
      });
    }
  }, [model, showHelperSnacks, functionalCookiesOk]);

  // Effect to update snap enabled state in SnapHelper and localStorage
  React.useEffect(() => {
    if (map?.snapHelper) {
      map.snapHelper.setSnapEnabled(snapEnabled);
    }
    if (functionalCookiesOk) {
      LocalStorageHelper.set(STORAGE_KEY, {
        ...LocalStorageHelper.get(STORAGE_KEY),
        snapEnabled: snapEnabled,
      });
    }
  }, [map, snapEnabled, functionalCookiesOk]);

  // Effect to update snap tolerance in SnapHelper and localStorage
  React.useEffect(() => {
    if (map?.snapHelper) {
      map.snapHelper.setPixelTolerance(snapTolerance);
    }
    if (functionalCookiesOk) {
      LocalStorageHelper.set(STORAGE_KEY, {
        ...LocalStorageHelper.get(STORAGE_KEY),
        snapTolerance: snapTolerance,
      });
    }
  }, [map, snapTolerance, functionalCookiesOk]);

  // Effect to reload snap settings from localStorage when cookie status changes
  React.useEffect(() => {
    const settings = getSnapSettings();
    setSnapEnabled(settings.snapEnabled);
    setSnapTolerance(settings.snapTolerance);
  }, [functionalCookiesOk, getSnapSettings]);

  return (
    <Grid container>
      <Grid sx={{ marginTop: 2 }} size={12}>
        <FormControl component="fieldset">
          <FormLabel focused={false} component="legend">
            {i18n.t("common.generalSettings")}
          </FormLabel>
          <HajkToolTip
            title={
              measurementSettings.showText
                ? i18n.t("sketch.settings.showTextOff")
                : i18n.t("sketch.settings.showTextOn")
            }
          >
            <FormControlLabel
              label={i18n.t("sketch.settings.showTextLabel")}
              control={
                <Switch
                  checked={measurementSettings.showText}
                  onChange={() => {
                    setMeasurementSettings((settings) => ({
                      ...settings,
                      showText: !settings.showText,
                    }));
                  }}
                  color="primary"
                />
              }
            />
          </HajkToolTip>
          <HajkToolTip
            title={
              showHelperSnacks
                ? i18n.t("sketch.settings.helperTextsOff")
                : i18n.t("sketch.settings.helperTextsOn")
            }
          >
            <FormControlLabel
              label={i18n.t("sketch.settings.helperTextsLabel")}
              control={
                <Switch
                  checked={showHelperSnacks}
                  onChange={() => setShowHelperSnacks((show) => !show)}
                  color="primary"
                />
              }
            />
          </HajkToolTip>
          {ogcSource !== NO_SERVICE_LABEL && (
            <HajkToolTip
              title={
                showKinkMarkers
                  ? i18n.t("sketch.settings.kinkMarkersOff")
                  : i18n.t("sketch.settings.kinkMarkersOn")
              }
            >
              <FormControlLabel
                label={i18n.t("sketch.settings.kinkMarkersLabel")}
                control={
                  <Switch
                    checked={showKinkMarkers}
                    onChange={() => setShowKinkMarkers((show) => !show)}
                    color="primary"
                  />
                }
              />
            </HajkToolTip>
          )}
          <HajkToolTip
            title={
              snapEnabled
                ? i18n.t("sketch.settings.snapOff")
                : i18n.t("sketch.settings.snapOn")
            }
          >
            <FormControlLabel
              label={i18n.t("sketch.settings.snapLabel")}
              control={
                <Switch
                  checked={snapEnabled}
                  onChange={() => setSnapEnabled((enabled) => !enabled)}
                  color="primary"
                />
              }
            />
          </HajkToolTip>
          <HajkToolTip
            title={
              showHajkToolTips.select4
                ? i18n.t("sketch.settings.snapToleranceHelp")
                : ""
            }
          >
            <FormControl
              size="small"
              style={{ marginTop: 8 }}
              disabled={!snapEnabled}
            >
              <InputLabel
                variant="outlined"
                id="sketch-select-snap-tolerance-label"
              >
                {i18n.t("sketch.settings.snapTolerance")}
              </InputLabel>
              <Select
                id="sketch-select-snap-tolerance"
                labelId="sketch-select-snap-tolerance-label"
                value={snapTolerance}
                label={i18n.t("sketch.settings.snapTolerance")}
                variant="outlined"
                onChange={(e) => setSnapTolerance(Number(e.target.value))}
                onFocus={() => handleFocus("select4", false)}
                onBlur={() => handleFocus("select4", true)}
              >
                {SNAP_TOLERANCE_OPTIONS.map((option, index) => {
                  return (
                    <MenuItem value={option.value} key={index}>
                      {option.name}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </HajkToolTip>
        </FormControl>
      </Grid>
      <Grid size={12}>
        <FormControl component="fieldset">
          <FormLabel focused={false} component="legend">
            {i18n.t("sketch.settings.measurement")}
          </FormLabel>

          <HajkToolTip
            title={
              !measurementSettings.showText
                ? i18n.t("sketch.settings.enableTextForPerimeter")
                : measurementSettings.showArea
                  ? i18n.t("sketch.settings.showAreaOff")
                  : i18n.t("sketch.settings.showAreaOn")
            }
          >
            <FormControlLabel
              label={i18n.t("sketch.settings.showAreaLabel")}
              control={
                <Switch
                  disabled={!measurementSettings.showText}
                  checked={measurementSettings.showArea}
                  onChange={() => {
                    setMeasurementSettings((settings) => ({
                      ...settings,
                      showArea: !settings.showArea,
                    }));
                  }}
                  color="primary"
                />
              }
            />
          </HajkToolTip>
          <HajkToolTip
            title={
              !measurementSettings.showText
                ? i18n.t("sketch.settings.enableTextForLength")
                : measurementSettings.showLength
                  ? i18n.t("sketch.settings.showLengthOff")
                  : i18n.t("sketch.settings.showLengthOn")
            }
          >
            <FormControlLabel
              label={i18n.t("sketch.settings.showLengthLabel")}
              control={
                <Switch
                  disabled={!measurementSettings.showText}
                  checked={measurementSettings.showLength ?? false}
                  onChange={() => {
                    setMeasurementSettings((settings) => ({
                      ...settings,
                      showLength: !settings.showLength,
                    }));
                  }}
                  color="primary"
                />
              }
            />
          </HajkToolTip>
          <HajkToolTip
            title={
              !measurementSettings.showText
                ? i18n.t("sketch.settings.enableTextForPerimeter")
                : measurementSettings.showPerimeter
                  ? i18n.t("sketch.settings.showPerimeterOff")
                  : i18n.t("sketch.settings.showPerimeterOn")
            }
          >
            <FormControlLabel
              label={i18n.t("sketch.settings.showPerimeterLabel")}
              control={
                <Switch
                  disabled={!measurementSettings.showText}
                  checked={measurementSettings.showPerimeter}
                  onChange={() => {
                    setMeasurementSettings((settings) => ({
                      ...settings,
                      showPerimeter: !settings.showPerimeter,
                    }));
                  }}
                  color="primary"
                />
              }
            />
          </HajkToolTip>
          <HajkToolTip
            title={
              showHajkToolTips.select1
                ? i18n.t("sketch.settings.areaUnitHelp")
                : ""
            }
          >
            <FormControl size="small" style={{ marginTop: 8 }}>
              <InputLabel
                variant="outlined"
                id="sketch-select-area-measurement-unit-label"
              >
                {i18n.t("sketch.settings.areaUnit")}
              </InputLabel>
              <Select
                id="sketch-select-area-measurement-unit"
                labelId="sketch-select-area-measurement-unit-label"
                value={measurementSettings.areaUnit}
                label={i18n.t("sketch.settings.areaUnit")}
                variant="outlined"
                onChange={(e) => {
                  setMeasurementSettings((settings) => ({
                    ...settings,
                    areaUnit: e.target.value,
                  }));
                }}
                onFocus={() => handleFocus("select1", false)}
                onBlur={() => handleFocus("select1", true)}
              >
                {AREA_MEASUREMENT_UNITS.map((unit, index) => {
                  return (
                    <MenuItem value={unit.type} key={index}>
                      {unit.name}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </HajkToolTip>

          <HajkToolTip
            title={
              showHajkToolTips.select2
                ? i18n.t("sketch.settings.lengthUnitHelp")
                : ""
            }
          >
            <FormControl size="small" style={{ marginTop: 16 }}>
              <InputLabel
                variant="outlined"
                id="sketch-select-length-measurement-unit-label"
              >
                {i18n.t("sketch.settings.lengthUnit")}
              </InputLabel>
              <Select
                id="sketch-select-length-measurement-unit"
                labelId="sketch-select-length-measurement-unit-label"
                value={measurementSettings.lengthUnit}
                label={i18n.t("sketch.settings.lengthUnit")}
                variant="outlined"
                onChange={(e) => {
                  setMeasurementSettings((settings) => ({
                    ...settings,
                    lengthUnit: e.target.value,
                  }));
                }}
                onFocus={() => handleFocus("select2", false)}
                onBlur={() => handleFocus("select2", true)}
              >
                {LENGTH_MEASUREMENT_UNITS.map((unit, index) => {
                  return (
                    <MenuItem value={unit.type} key={index}>
                      {unit.name}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </HajkToolTip>
          <HajkToolTip
            title={
              showHajkToolTips.select3
                ? i18n.t("sketch.settings.precisionHelp")
                : ""
            }
          >
            <FormControl size="small" style={{ marginTop: 16 }}>
              <InputLabel variant="outlined" id="sketch-select-precision-label">
                {i18n.t("sketch.settings.precision")}
              </InputLabel>
              <Select
                id="sketch-select-precision"
                labelId="sketch-select-precision-label"
                value={measurementSettings.precision ?? 0}
                label={i18n.t("sketch.settings.precision")}
                variant="outlined"
                onChange={(e) => {
                  setMeasurementSettings((settings) => ({
                    ...settings,
                    precision: parseInt(e.target.value),
                  }));
                }}
                onFocus={() => handleFocus("select3", false)}
                onBlur={() => handleFocus("select3", true)}
              >
                {MEASUREMENT_PRECISIONS.map((precision, index) => {
                  return (
                    <MenuItem value={precision.value} key={index}>
                      {precision.name}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </HajkToolTip>
          <HajkToolTip
            title={
              showHajkToolTips.select5
                ? i18n.t("sketch.settings.pointPrecisionHelp")
                : ""
            }
          >
            <FormControl size="small" style={{ marginTop: 16 }}>
              <InputLabel
                variant="outlined"
                id="sketch-select-point-precision-label"
              >
                {i18n.t("sketch.settings.pointPrecision")}
              </InputLabel>
              <Select
                id="sketch-select-point-precision"
                labelId="sketch-select-point-precision-label"
                value={measurementSettings.pointPrecision ?? 0}
                label={i18n.t("sketch.settings.pointPrecision")}
                variant="outlined"
                onChange={(e) => {
                  setMeasurementSettings((settings) => ({
                    ...settings,
                    pointPrecision: parseInt(e.target.value),
                  }));
                }}
                onFocus={() => handleFocus("select5", false)}
                onBlur={() => handleFocus("select5", true)}
              >
                {MEASUREMENT_PRECISIONS.map((precision, index) => {
                  return (
                    <MenuItem value={precision.value} key={index}>
                      {precision.name}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </HajkToolTip>
        </FormControl>
      </Grid>
    </Grid>
  );
};

export default SettingsView;
