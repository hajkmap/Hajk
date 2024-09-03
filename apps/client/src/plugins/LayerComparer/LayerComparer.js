import React, { useEffect, useRef, useState } from "react";
import BaseLayer from "ol/layer/Base";
import { Alert, Button, Stack } from "@mui/material";
import CompareIcon from "@mui/icons-material/Compare";
import { useSnackbar } from "notistack";

import DialogWindowPlugin from "../../plugins/DialogWindowPlugin";
import SelectDropdown from "./SelectDropdown.js";
import SDSControl from "./CustomOLControl.js";

const LayerComparer = (props) => {
  const [layerId1, setLayerId1] = useState("");
  const [layerId2, setLayerId2] = useState("");

  const [layers, setLayers] = useState([]);
  const [baseLayers, setBaseLayers] = useState([]);

  // Prepare a ref that will hold our map control
  const sds = useRef();

  // Two more refs that will hold the OL layer objects
  const l1 = useRef();
  const l2 = useRef();

  // Prepare a ref that will hold the original OL background
  // layer object. This makes it possible to restore
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
    // If layer1 or layer2 changed, it means that the Dialog is visible
    // and we never want to show the snackbar simultaneously. Let's close it.
    closeSnackbar(helperSnack.current);

    if (layerId1 === "" || layerId2 === "") {
      // If any of the layer dropdowns is empty, we can't compare.
      resetSdsAndOl();
    } else {
      // If both IDs are set, we can attempt to grab the layers from the map
      // and start comparing.
      l1.current = props.map.getAllLayers().find((l) => l.ol_uid === layerId1);
      l2.current = props.map.getAllLayers().find((l) => l.ol_uid === layerId2);

      // Let's save the original background layer, so we can restore it later
      oldBackgroundLayer.current = props.map
        .getAllLayers()
        .find((l) => l.getVisible() === true && l.get("layerType") === "base");
      // Also, let's hide it for now
      oldBackgroundLayer.current?.setVisible(false);

      // Activate the compare OL control
      sds.current.open();
      sds.current.setCompareLayers(l1.current, l2.current);
    }
  }, [layerId1, layerId2, props.map, closeSnackbar]);

  const resetSdsAndOl = () => {
    // Remove the ref to our OL control
    sds.current.remove();

    // Let's hide compare layers in Map
    l1.current?.setVisible(false);
    l2.current?.setVisible(false);

    // Show original background layer
    oldBackgroundLayer.current?.setVisible(true);
  };

  const onVisibilityChanged = (visible) => {
    // If the Dialog becomes visible, but there already is a snackbar,
    // we must close it in order to avoid duplicate snackbars.
    if (visible === true && helperSnack.current !== null) {
      // This ugly hack is needed to avoid warnings due to a race condition
      // in React's render.
      setTimeout(() => {
        closeSnackbar(helperSnack.current);
      });
    }
  };

  const onAbort = () => {
    // Unsetting these state variables will cleanup the UI
    // as well as trigger the useEffect above to run and
    // take rest of remaining cleanups (once both variables
    // are empty strings).
    setLayerId1("");
    setLayerId2("");
  };

  // onClose is actually the callback that runs when user
  // clicks the primary action button in the Dialog, i.e. "Compare".
  const onClose = () => {
    // Ensure that there are real layers to compare
    if (l1.current instanceof BaseLayer && l2.current instanceof BaseLayer) {
      helperSnack.current = enqueueSnackbar(null, {
        variant: "default",
        persist: true,
        anchorOrigin: { vertical: "bottom", horizontal: "center" },
        sx: {
          // Custom styling to follow Material Design guidelines for Snackbar.
          // Placing the close button to the right of the text.
          ".SnackbarItem-contentRoot": {
            flexWrap: "inherit !important",
          },
          // Since we don't have any text in the snackbar anymore, but the
          // container is there, we want to remove padding from the actions container.
          ".SnackbarItem-action": {
            paddingLeft: 0,
          },
        },
        action: (key) => (
          <>
            <Button
              variant="contained"
              color="primary"
              sx={{ mr: 1 }}
              onClick={() => {
                props.app.globalObserver.publish("layercomparer.showWindow");
              }}
            >
              Välj andra lager
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={() => {
                onAbort();
              }}
            >
              Sluta jämföra
            </Button>
          </>
        ),
      });
    }
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
        onAbort: onAbort, // Called when user presses the Reset & Close button
        onClose: onClose, // Called when user presses the main primary button
        onVisibilityChanged: onVisibilityChanged, // Called when the dialog is shown or hidden
      }}
    >
      <Stack spacing={2}>
        <Alert icon={<CompareIcon />} variant="info">
          Välj två lager att jämföra och tryck på <i>Jämför</i>.
        </Alert>

        <SelectDropdown
          setter={setLayerId1}
          value={layerId1}
          counterValue={layerId2}
          baseLayers={baseLayers}
          layers={layers}
          label="Vänster sida"
        />
        <SelectDropdown
          setter={setLayerId2}
          value={layerId2}
          counterValue={layerId1}
          baseLayers={baseLayers}
          layers={layers}
          label="Höger sida"
        />
      </Stack>
    </DialogWindowPlugin>
  );
};

export default LayerComparer;
