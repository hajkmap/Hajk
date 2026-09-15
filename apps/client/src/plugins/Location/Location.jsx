import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Observer from "react-event-observer";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import { useSnackbar } from "notistack";

import BaseWindowPlugin from "../BaseWindowPlugin";
import LocationModel from "./LocationModel";
import LocationView from "./LocationView";
import CustomControlButtonView from "./CustomControlButtonView";
import LocationPopup from "./LocationPopup";

function Location(props) {
  const [snackbarKey, setSnackbarKey] = useState(null);
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const options = props.options;
  const localObserver = useRef(Observer());
  const modelRef = useRef(null);

  if (!modelRef.current) {
    modelRef.current = new LocationModel({
      ...props,
      localObserver: localObserver.current,
    });
  }
  const model = modelRef.current;

  // Subscribe to the event for active tracking to display the snackbar with follow
  useEffect(() => {
    const unsubStatus = localObserver.current.subscribe(
      "locationStatus",
      (status) => {
        const isOn = status === "on";

        if (isOn && !snackbarKey) {
          const key = enqueueSnackbar("", {
            persist: true,
            anchorOrigin: { vertical: "bottom", horizontal: "center" },
            content: (key) => <LocationPopup key={key} model={model} />,
          });
          setSnackbarKey(key);
        } else if (!isOn && snackbarKey) {
          closeSnackbar(snackbarKey);
          setSnackbarKey(null);
        }
      }
    );

    return () => {
      unsubStatus.unsubscribe();
    };
  }, [snackbarKey, model, enqueueSnackbar, closeSnackbar]);

  // This custom renderer (used for Control button) will bypass
  // the usual stuff that renders in BaseWindowPlugin, while still
  // being an instance of it.
  // The reason we do this is that none of the available rendering
  // modes from BaseWindowPlugin satisfy our needs. We don't want
  // a Drawer button, neither a Widget nor Control button. Instead
  // we need a special Toggle Button that can be either on or off,
  // and that will render next to the "normal" control buttons.
  const renderControlButton = () => {
    return createPortal(
      <CustomControlButtonView
        defaultTooltip={`Positionera: Visa min position i kartan`}
        model={model}
      />,
      document.getElementById("plugin-control-buttons")
    );
  };

  return (
    <BaseWindowPlugin
      {...props}
      type="Location"
      custom={{
        icon: <MyLocationIcon />,
        title: "Positionera",
        description: "Visa min position i kartan",
        height: 450,
        width: 430,
        top: undefined,
        left: undefined,
        model: model,
        // Supply a custom renderer *if* admin wants to render this plugin
        // as a Control button
        render: props.options.target === "control" ? renderControlButton : null,
      }}
    >
      <LocationView map={props.map} model={model} options={options} />
    </BaseWindowPlugin>
  );
}

export default Location;
