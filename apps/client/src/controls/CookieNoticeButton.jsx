import React from "react";
import CookieIcon from "@mui/icons-material/Cookie";

import ControlButton from "components/ControlButton";

/**
 * @summary Displays the cookie notice dialog
 *
 * @param {object} props
 * @returns {object} React
 */
const CookieNoticeButton = (props) => {
  return (
    props.appModel.config.mapConfig.map.showCookieNoticeButton && (
      <ControlButton
        tooltip="Visa cookie meddelande"
        ariaLabel="CookieNoticeButton"
        onClick={() => {
          props.appModel.globalObserver.publish("core.showCookieBanner");
        }}
      >
        <CookieIcon />
      </ControlButton>
    )
  );
};

export default CookieNoticeButton;
