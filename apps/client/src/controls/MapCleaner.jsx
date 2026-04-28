import React from "react";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

import ControlButton from "components/ControlButton";
import useSnackbar from "../hooks/useSnackbar";

/**
 * @summary Hides all visible layers
 *
 * @param {object} props
 * @returns {object} React
 */
const MapCleaner = React.memo((props) => {
  const { clearSnackbar } = useSnackbar();

  return (
    props.appModel.config.mapConfig.map.mapcleaner && (
      <ControlButton
        tooltip="Dölj alla aktiva lager"
        ariaLabel="Rensa kartan"
        onClick={() => {
          props.appModel.clear();
          clearSnackbar();
        }}
      >
        <VisibilityOffIcon />
      </ControlButton>
    )
  );
});

export default MapCleaner;
