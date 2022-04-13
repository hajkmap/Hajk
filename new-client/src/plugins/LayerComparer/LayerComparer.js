import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  FormControl,
  InputLabel,
  ListSubheader,
  Select,
  MenuItem,
} from "@mui/material";
import DialogWindowPlugin from "plugins/DialogWindowPlugin";
import CompareIcon from "@mui/icons-material/Compare";

import SDSControl from "./CustomOLControl.js";

const LayerComparer = (props) => {
  const [layer1, setLayer1] = useState("");
  const [layer2, setLayer2] = useState("");

  const [layers, setLayers] = useState([]);
  const [baseLayers, setBaseLayers] = useState([]);
  const sds = useRef();
  const oldBackgroundLayer = useRef();

  useEffect(() => {
    const allLayers = props.map.getAllLayers();
    const baseLayers = allLayers
      .filter((l) => l.layerType === "base")
      .map((l) => {
        return { id: l.ol_uid, label: l.get("caption") };
      });
    const layers = allLayers
      .filter((l) => l.layerType === "layer")
      .map((l) => {
        return { id: l.ol_uid, label: l.get("caption") };
      });

    setBaseLayers(baseLayers);
    setLayers(layers);
  }, [props.map]);

  useEffect(() => {
    console.log("Creating and adding SDS control to Map");
    sds.current = new SDSControl();
    props.map.addControl(sds.current);
  }, [props.map]);

  useEffect(() => {
    if (layer1 === "" || layer2 === "") {
      // Show previous background
      oldBackgroundLayer.current?.setVisible(true);
    } else {
      const l1 = props.map.getAllLayers().find((l) => l.ol_uid === layer1);
      const l2 = props.map.getAllLayers().find((l) => l.ol_uid === layer2);
      console.log("Both layers selected:", l1, l2);

      // Hide old background layers
      oldBackgroundLayer.current = props.map
        .getAllLayers()
        .find((l) => l.getVisible() === true && l.layerType === "base");
      oldBackgroundLayer.current?.setVisible(false);

      sds.current.open();
      sds.current.setLeftLayer(l1);
      sds.current.setRightLayer(l2);
      console.log(
        "Visible layers",
        props.map
          .getAllLayers()
          .filter((l) => l.getVisible() === true && l.layerType === "base")
      );
    }
  }, [layer1, layer2, props.map]);

  return (
    <DialogWindowPlugin
      options={props.options} // Supply the unique instance's options…
      map={props.map} // …but the shared map…
      app={props.app} // …and app.
      type="LayerComparer" // Unique name - each plugin needs one. Upper-case first letter, must be valid JS variable name.
      defaults={{
        // Some defaults to fall back to in case instanceOptions doesn't provide them.
        icon: <CompareIcon />, // Default icon for this plugin
        title: "Lagerjämförare",
        description: "Jämför två lager sida vid sida", // Shown on Widget button as well as Tooltip for Control button
        headerText: "Jämför två lager sida vid sida",
        buttonText: "OK",
      }}
    >
      {(layer1 === "" || layer2 === "") && (
        <Alert variant="info">Välj två lager för att jämföra</Alert>
      )}
      <SelectDropdown
        setter={setLayer1}
        value={layer1}
        counterValue={layer2}
        baseLayers={baseLayers}
        layers={layers}
        label="Lager 1"
      />
      <SelectDropdown
        setter={setLayer2}
        value={layer2}
        counterValue={layer1}
        baseLayers={baseLayers}
        layers={layers}
        label="Lager 2"
      />
    </DialogWindowPlugin>
  );
};

const SelectDropdown = (props) => {
  const { setter, value, counterValue, baseLayers, layers, label } = props;

  const handleChange = (setter, value) => {
    setter(value);
  };

  return (
    <Box sx={{ minWidth: 120 }}>
      <FormControl fullWidth>
        <InputLabel id="layer-1-label">{label}</InputLabel>
        <Select
          labelId="layer-1-label"
          id="layer-1-select"
          label="Lager 1"
          value={value}
          onChange={(e) => handleChange(setter, e.target.value)}
        >
          <MenuItem value="">Inget lager valt</MenuItem>
          <ListSubheader>Bakgrundslager</ListSubheader>
          {baseLayers.map((l, i) => {
            return (
              <MenuItem key={i} value={l.id} disabled={l.id === counterValue}>
                {l.label}
              </MenuItem>
            );
          })}
          <ListSubheader>Lager</ListSubheader>
          {layers.map((l, i) => {
            return (
              <MenuItem key={i} value={l.id}>
                {l.label}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>
    </Box>
  );
};

export default LayerComparer;
