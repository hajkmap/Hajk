import React from "react";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

import ControlButton from "components/ControlButton";
import useSnackbar from "../hooks/useSnackbar";
import { useTranslation } from "react-i18next";

/**
 * @summary Hides all visible layers
 *
 * @param {object} props
 * @returns {object} React
 */
const MapCleaner = React.memo((props) => {
  const { clearSnackbar } = useSnackbar();
  const { t } = useTranslation();

  return (
    props.appModel.config.mapConfig.map.mapcleaner && (
      <ControlButton
        tooltip={t("controls.hideAllLayers")}
        ariaLabel={t("controls.clearMap")}
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
