import CookieIcon from "@mui/icons-material/Cookie";

import ControlButton from "components/ControlButton";
import { useTranslation } from "react-i18next";

/**
 * @summary Displays the cookie notice dialog
 *
 * @param {object} props
 * @returns {object} React
 */
const CookieNoticeButton = (props) => {
  const { t } = useTranslation();
  return (
    props.appModel.config.mapConfig.map.showCookieNoticeButton && (
      <ControlButton
        tooltip={t("controls.showCookieNotice")}
        ariaLabel={t("controls.showCookieNotice")}
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
