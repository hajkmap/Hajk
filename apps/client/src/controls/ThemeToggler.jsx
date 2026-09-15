import Brightness4Icon from "@mui/icons-material/Brightness4";

import ControlButton from "components/ControlButton";

/**
 * @summary Toggles between dark and light theme
 *
 * @param {object} props
 * @returns {object} React
 */
const ThemeToggler = (props) => {
  return (
    (props.showThemeToggler && (
      <ControlButton
        tooltip="Växla mellan mörkt och ljust färgtema"
        ariaLabel="Växla färgtema"
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
