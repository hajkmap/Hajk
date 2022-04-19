import React, { useEffect, useRef, useState } from "react";
import { Alert, Stack } from "@mui/material";
import DialogWindowPlugin from "plugins/DialogWindowPlugin";
import CompareIcon from "@mui/icons-material/Compare";

import SelectDropdown from "./SelectDropdown.js";
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
    sds.current = new SDSControl();
    props.map.addControl(sds.current);
  }, [props.map]);

  useEffect(() => {
    if (layer1 === "" || layer2 === "") {
      // Show previous background
      oldBackgroundLayer.current?.setVisible(true);

      // Remove the slider as soon as one of the compare layers is not selected
      sds.current.remove();
    } else {
      const l1 = props.map.getAllLayers().find((l) => l.ol_uid === layer1);
      const l2 = props.map.getAllLayers().find((l) => l.ol_uid === layer2);

      // Hide old background layers
      oldBackgroundLayer.current = props.map
        .getAllLayers()
        .find((l) => l.getVisible() === true && l.layerType === "base");
      oldBackgroundLayer.current?.setVisible(false);

      sds.current.open();
      sds.current.setCompareLayers(l1, l2);
    }
  }, [layer1, layer2, props.map]);

  const onAbort = () => {
    sds.current.remove();
    oldBackgroundLayer.current?.setVisible(true);
    setLayer1("");
    setLayer2("");
  };

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
        description: "Jämför lager sida vid sida", // Shown on Widget button as well as Tooltip for Control button
        headerText: "Jämför lager sida vid sida",
        buttonText: "Jämför",
        primaryButtonVariant: "contained",
        abortText: "Nollställ & stäng",
        onAbort: onAbort,
      }}
    >
      <Stack spacing={2}>
        <Alert icon={<CompareIcon />} variant="info">
          Välj två lager att jämföra och tryck på <i>Jämför</i>.
        </Alert>

        <SelectDropdown
          setter={setLayer1}
          value={layer1}
          counterValue={layer2}
          baseLayers={baseLayers}
          layers={layers}
          label="Vänster sida"
        />
        <SelectDropdown
          setter={setLayer2}
          value={layer2}
          counterValue={layer1}
          baseLayers={baseLayers}
          layers={layers}
          label="Höger sida"
        />
      </Stack>
    </DialogWindowPlugin>
  );
};

export default LayerComparer;
