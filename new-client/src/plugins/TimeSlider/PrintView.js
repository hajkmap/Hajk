import React, { useState, useEffect, useMemo } from "react";
import { FormControl, Grid, InputLabel, MenuItem, Select } from "@mui/material";

import PrintDialog from "./components/PrintDialog";
import RangeSlider from "./components/RangeSlider";
import PrintInformationPanel from "./components/PrintInformationPanel";
import PrintButton from "./components/PrintButton";

import {
  DEFAULT_PRINT_OPTIONS,
  INFORMATION_PANEL_MODES,
  MAX_IMAGES_FOR_PRINT,
} from "./constants";
import useCancelToken from "hooks/useCancelToken";

export default function PrintView(props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [scale, setScale] = useState(() => props.printModel.getFittingScale());
  const [resolution, setResolution] = useState(props.resolution);
  const [stepSize, setStepSize] = useState(props.stepSize);
  const [dateRange, setDateRange] = useState([props.startTime, props.endTime]);
  // We need a way to cancel the async image creation...
  const [token, cancel, reset] = useCancelToken();

  const printOptions = useMemo(
    () => ({
      useMargin: false,
      useTextIconsInMargin: false,
      format: "a4",
      orientation: "landscape",
      resolution: 150,
      scale: scale,
      mapTitle: "",
      printComment: "",
      mapTextColor: "#000000",
      includeLogo: false,
      includeNorthArrow: false,
      includeScaleBar: true,
      scaleBarPlacement: "bottomLeft",
      saveAsType: "BLOB",
    }),
    [scale]
  );

  useEffect(() => {
    !props.printModel.previewLayer && props.printModel.addPreviewLayer();
    props.printModel.renderPreviewFeature(!props.windowHidden, printOptions);

    return () => props.printModel.renderPreviewFeature(false, printOptions);
  }, [printOptions, props.windowHidden, props.printModel]);

  // Creates an array containing dates withing the current range, separated by the current resolution
  const getDateArrayFromCurrentRange = () => {
    return Array.from(
      { length: (dateRange[1] - dateRange[0]) / stepSize + 1 },
      (_, index) => dateRange[0] + index * stepSize
    );
  };

  // Creates images based on the current range and resolution set by the user in the ui
  const printAllImagesInRange = async () => {
    // Create an array containing the dates to be printed
    const dates = getDateArrayFromCurrentRange();
    // The images are to be saved as a zip, let's store them in an array for now...
    const blobs = [];
    // For every date, update the map and create an image
    for await (const date of dates) {
      // We have to update the map so that it represents the current date
      await props.updateSliderAndRenderLayersAtTime(date);
      // Then we can create the image
      const blob = await props.printModel.print({
        ...printOptions,
        mapTitle: props.getDateLabel(date, resolution),
        mapTextColor: "#FFFFFF",
      });
      // We have to keep track of wether the user has cancelled or not...
      if (token.cancelled) {
        // If they've cancelled, we break the loop
        break;
      }
      blobs.push(blob);
    }
    // Before we return anything, we have to check for cancellation again...
    if (token.cancelled) {
      // If we've been cancelled, we have to make sure to reset the cancellation-token...
      reset();
      // ... and return nothing!
      return null;
    } else {
      // Otherwise, we can return the images!
      return blobs;
    }
  };

  const handleOnPrintClick = async () => {
    setDialogOpen(true);
    await printAllImagesInRange();
    setDialogOpen(false);
  };

  const handleOnCancelClick = () => {
    setDialogOpen(false);
    cancel();
  };

  const handleResolutionChange = (e) => {
    const { value } = e.target;
    setResolution(value);
    setStepSize(props.getStepSize(value));
  };

  const handleScaleChange = (e) => {
    const { value } = e.target;
    setScale(value);
  };

  // We want to keep track of the number of images that are about to be printed with the current settings so that we can warn the user etc.
  const numImages = Math.floor((dateRange[1] - dateRange[0]) / stepSize + 1);
  // We don't want to allow the user to print to many images... Every image takes a couple of seconds...
  const printDisabled = numImages > MAX_IMAGES_FOR_PRINT;
  // We also want to warn the user by highlighting the information panel if we are close (or over) the maximum number of images...
  const informationPanelMode =
    numImages > MAX_IMAGES_FOR_PRINT // More than max images= Highlight error...
      ? INFORMATION_PANEL_MODES.ERROR
      : numImages > 0.8 * MAX_IMAGES_FOR_PRINT // More than 80% of max images? Highlight warning....
      ? INFORMATION_PANEL_MODES.WARNING
      : INFORMATION_PANEL_MODES.OK; // Otherwise we're OK!

  return (
    <Grid
      container
      justifyContent="center"
      sx={{ width: "100%", height: "100%" }}
    >
      <PrintInformationPanel
        message={`Vid utskrift så kommer en bild skapas för varje "steg" i tidslinjen. Nuvarande inställningar kommer resultera i ${numImages} bilder.`}
        mode={informationPanelMode}
      />
      <RangeSlider
        title="Välj utskriftsintervall:"
        value={dateRange}
        getAriaLabel={() => "Utskriftsintervall"}
        onChange={(e, v) => setDateRange(v)}
        valueLabelFormat={(v) => props.getDateLabel(v, resolution)}
        min={props.startTime}
        max={props.endTime}
        step={stepSize}
        marks={props.marks}
      />
      <Grid container item xs={12} sx={{ p: 2 }} spacing={2}>
        <Grid item xs={6}>
          <FormControl fullWidth={true}>
            <InputLabel variant="standard" htmlFor="resolution">
              Upplösning
            </InputLabel>
            <Select
              variant="standard"
              value={resolution}
              onChange={handleResolutionChange}
            >
              <MenuItem value={"days"}>Dag</MenuItem>
              <MenuItem value={"months"}>Månad</MenuItem>
              <MenuItem value={"quarters"}>Kvartal</MenuItem>
              <MenuItem value={"years"}>År</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6}>
          <FormControl fullWidth={true}>
            <InputLabel variant="standard" htmlFor="scale">
              Skala
            </InputLabel>
            <Select
              variant="standard"
              value={scale}
              onChange={handleScaleChange}
            >
              {DEFAULT_PRINT_OPTIONS.scales.map((s) => (
                <MenuItem value={s} key={s}>
                  {props.printModel.getUserFriendlyScale(s)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      <PrintButton onClick={handleOnPrintClick} disabled={printDisabled} />
      <PrintDialog open={dialogOpen} cancelPrint={handleOnCancelClick} />
    </Grid>
  );
}
