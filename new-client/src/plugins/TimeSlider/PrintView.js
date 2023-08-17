import React, { useState, useEffect } from "react";
import { Button, Grid, Tooltip, Typography } from "@mui/material";

import PrintDialog from "./components/PrintDialog";
import RangeSlider from "./components/RangeSlider";

import {
  MAX_IMAGES_FOR_PRINT,
  PRINT_DISABLED_TOOLTIP,
  PRINT_ENABLED_TOOLTIP,
  PRINT_STATUS,
} from "./constants";
import PrintInformationPanel from "./components/PrintInformationPanel";

export default function PrintView(props) {
  // We might want custom print settings?
  // const [printSettings, setPrintSetting] = useState({
  //   start: props.startTime,
  //   end: props.endTime,
  //   stepSize: props.stepSize,
  // });

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
    // Show dialog
    // Stop and reset slider
    // Create one print for each time-section
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
    console.log("result: ", result);
  };

  const cancel = () => {
    setDialogOpen(false);
    setPrintStatus(PRINT_STATUS.ABORT);
  };

  const numImages = Math.floor((dateRange[1] - dateRange[0]) / props.stepSize);

  const message = `Vid utskrift så kommer en bild skapas för varje "steg" i tidslinjen. Nuvarande inställningar kommer resultera i ${numImages} bilder.`;

  // We don't want to allow the user to print to many images... Every image takes a couple of seconds...
  const printDisabled = numImages > MAX_IMAGES_FOR_PRINT;

  return (
    <Grid
      container
      justifyContent="center"
      sx={{ width: "100%", height: "100%" }}
    >
      <PrintInformationPanel message={message} />

      <RangeSlider
        title="Välj datumintervall:"
        value={dateRange}
        getAriaLabel={() => "Datumintervall"}
        onChange={(e, v) => setDateRange(v)}
        valueLabelFormat={(v) => props.getDateLabel(v, resolution)}
        min={props.startTime}
        max={props.endTime}
        step={props.stepSize}
        marks={props.marks}
      />
      <Grid
        container
        item
        xs={12}
        justifyContent="center"
        alignContent="center"
      >
        <Tooltip
          title={printDisabled ? PRINT_DISABLED_TOOLTIP : PRINT_ENABLED_TOOLTIP}
        >
          <span>
            <Button
              variant="contained"
              onClick={print}
              disabled={printDisabled}
            >
              Skriv ut
            </Button>
          </span>
        </Tooltip>
      </Grid>
      <PrintDialog open={dialogOpen} cancelPrint={cancel} />
    </Grid>
  );
}
