import React, { useEffect, useRef, useState } from "react";
import { Alert, Button, Stack } from "@mui/material";
import DialogWindowPlugin from "plugins/DialogWindowPlugin";
import CompareIcon from "@mui/icons-material/Compare";
import { useSnackbar } from "notistack";

import SelectDropdown from "./SelectDropdown.js";
import SDSControl from "./CustomOLControl.js";

const LayerComparer = (props) => {
  const [layer1, setLayer1] = useState("");
  const [layer2, setLayer2] = useState("");

  const [layers, setLayers] = useState([]);
  const [baseLayers, setBaseLayers] = useState([]);

  // Prepare a ref that will hold our map control
  const sds = useRef();

  // Prepare a ref that will hold the ID of the original
  // background layer. This makes it possible to restore
  // to the same background when user closes the comparer.
  const oldBackgroundLayer = useRef();

  // When compare mode is active, we want to show a snackbar that
  // allows user to simply disable the comparer.
  const { closeSnackbar, enqueueSnackbar } = useSnackbar();
  // We don't want to prompt the user with more than one snack, so lets track the current one,
  // so that we can close it when another one is about to open.
  const helperSnack = React.useRef(null);

  // Prepare layers that will be available in the comparer.
  // By doing it in this useEffect, we do it once and for all,
  // which is a good idea, as such filter/map can be considered
  // an expensive operation.
  useEffect(() => {
    const allLayers = props.map.getAllLayers();
    const baseLayers = allLayers
      .filter((l) => l.get("layerType") === "base")
      .map((l) => {
        return { id: l.ol_uid, label: l.get("caption") };
      });

    if (props.options.showNonBaseLayersInSelect) {
      const layers = allLayers
        .filter((l) => ["layer", "group"].includes(l.get("layerType")))
        .map((l) => {
          return { id: l.ol_uid, label: l.get("caption") };
        });
      setLayers(layers);
    }

    setBaseLayers(baseLayers);
  }, [props.map, props.options.showNonBaseLayersInSelect]);

  // Create a new SDSControl, add to a ref and add the ref to our map.
  useEffect(() => {
    sds.current = new SDSControl();
    props.map.addControl(sds.current);
  }, [props.map]);

  // When Hajk Drawer is toggled the map's view (canvas's) size
  // changes too. We must update the clipper's position accordingly.
  useEffect(() => {
    props.app.globalObserver.on("core.drawerToggled", () => {
      sds.current.updateClip();
    });
  }, [props.app.globalObserver]);

  // The main action happens in this useEffect. When both compare layers
  // are set we initialize the comparer control and make it visible.
  // If both compare layers are empty, we do the contrary and remove the control
  // and restore the original background layer.
  useEffect(() => {
    if (layer1 === "" || layer2 === "") {
      // Show previous background
      oldBackgroundLayer.current?.setVisible(true);

      // Remove the slider as soon as one of the compare layers is not selected
      sds.current.remove();

      // Close the snackbar
      closeSnackbar(helperSnack.current);
    } else {
      const l1 = props.map.getAllLayers().find((l) => l.ol_uid === layer1);
      const l2 = props.map.getAllLayers().find((l) => l.ol_uid === layer2);

      // Hide old background layers
      oldBackgroundLayer.current = props.map
        .getAllLayers()
        .find((l) => l.getVisible() === true && l.get("layerType") === "base");
      oldBackgroundLayer.current?.setVisible(false);

      sds.current.open();
      sds.current.setCompareLayers(l1, l2);

      // Show the snackbar
      helperSnack.current = enqueueSnackbar(
        "Avsluta jämföringsläget genom att trycka på knappen",
        {
          variant: "default",
          persist: true,
          anchorOrigin: { vertical: "bottom", horizontal: "center" },
          action: (key) => (
            <Button
              onClick={() => {
                onAbort();
                closeSnackbar(key);
              }}
            >
              Sluta jämföra
            </Button>
          ),
        }
      );
    }
  }, [layer1, layer2, props.map, closeSnackbar, enqueueSnackbar]);

  // User can at any time abort the comparer, here's a handler
  // that resets the UI.
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
