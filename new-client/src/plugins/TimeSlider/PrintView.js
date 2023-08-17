import React, { useState, useEffect } from "react";
import { Grid } from "@mui/material";

import PrintDialog from "./components/PrintDialog";
import RangeSlider from "./components/RangeSlider";
import PrintInformationPanel from "./components/PrintInformationPanel";
import PrintButton from "./components/PrintButton";

import {
  INFORMATION_PANEL_MODES,
  MAX_IMAGES_FOR_PRINT,
  PRINT_STATUS,
} from "./constants";

export default function PrintView(props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [printStatus, setPrintStatus] = useState(PRINT_STATUS.IDLE);
  const [resolution] = useState(props.resolution);
  const [dateRange, setDateRange] = useState([props.startTime, props.endTime]);

  useEffect(() => {
    props.printModel.addPreviewLayer();
    props.printModel.addPreview({
      format: "a4",
      orientation: "landscape",
      scale: "5000",
      useMargin: false,
      useTextIconsInMargin: false,
    });
  }, [props.printModel]);

  const print = async () => {
    setDialogOpen(true);
    setPrintStatus(PRINT_STATUS.BUSY);
    const result = await props.printModel.print({
      scale: "5000",
      resolution: "150",
      format: "a4",
      orientation: "landscape",
      useMargin: false,
      useTextIconsInMargin: false,
      mapTitle: "",
      printComment: "",
    });
    console.log("result: ", result, "printStatus: ", printStatus);
  };

  const cancel = () => {
    setDialogOpen(false);
    setPrintStatus(PRINT_STATUS.ABORT);
  };

  // We want to keep track of the number of images that are about to be printed with the current settings so that we can warn the user etc.
  const numImages = Math.floor((dateRange[1] - dateRange[0]) / props.stepSize);
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
        step={props.stepSize}
        marks={props.marks}
      />
      <PrintButton onClick={print} disabled={printDisabled} />
      <PrintDialog open={dialogOpen} cancelPrint={cancel} />
    </Grid>
  );
}
