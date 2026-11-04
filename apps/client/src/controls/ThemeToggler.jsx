import Brightness4Icon from "@mui/icons-material/Brightness4";

import ControlButton from "components/ControlButton";
import { useTranslation } from "react-i18next";

/**
 * @summary Toggles between dark and light theme
 *
 * @param {object} props
 * @returns {object} React
 */
const ThemeToggler = (props) => {
  const { t } = useTranslation();
  return (
    (props.showThemeToggler && (
      <ControlButton
        tooltip={t("controls.toggleThemeTooltip")}
        ariaLabel={t("controls.toggleTheme")}
        onClick={() => {
          props.toggleMUITheme();
        }}
      >
        <Brightness4Icon />
      </ControlButton>
    )) ||
    null
  );
};

export default ThemeToggler;
