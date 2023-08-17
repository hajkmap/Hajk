import React, { useState, useEffect } from "react";
import { Button, Grid, Typography } from "@mui/material";

import PrintDialog from "./components/PrintDialog";
import RangeSlider from "./components/RangeSlider";

import { PRINT_STATUS } from "./constants";

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

  const numSteps = Math.floor((dateRange[1] - dateRange[0]) / props.stepSize);

  const message = `Vid utskrift så kommer en bild skapas för varje "steg" i tidslinjen. Nuvarande inställningar kommer resultera i ${numSteps} bilder.`;

  return (
    <Grid
      container
      justifyContent="center"
      sx={{ width: "100%", height: "100%" }}
    >
      <Grid item xs={12}>
        <Typography align="center">{message}</Typography>
      </Grid>
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
        <Button variant="contained" onClick={print}>
          Skriv ut
        </Button>
      </Grid>
      <PrintDialog open={dialogOpen} cancelPrint={cancel} />
    </Grid>
  );
}
