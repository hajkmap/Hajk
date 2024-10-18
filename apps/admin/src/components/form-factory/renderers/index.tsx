import renderTextField from "./text-field";
import renderSelect from "./select";
import renderSlider from "./slider";
import renderRadioGroup from "./radio-group";
import renderCheckbox from "./checkbox";
import renderSwitch from "./switch";
import renderNumberField from "./number";
import INPUT_TYPE from "../types/input-type";
import STATIC_TYPE from "../types/static-type";
import renderHeader from "./header";
import renderDivider from "./divider";
import renderSpacer from "./spacer";
import renderTextArea from "./text-area";

// When a new renderer is added, add it here
// and add the correct type in
// ../types/input-type or ../types/static-type or ../types/container-types
const renderFunctions = {
  [INPUT_TYPE.TEXTFIELD]: renderTextField,
  [INPUT_TYPE.SELECT]: renderSelect,
  [INPUT_TYPE.SLIDER]: renderSlider,
  [INPUT_TYPE.RADIO]: renderRadioGroup,
  [INPUT_TYPE.CHECKBOX]: renderCheckbox,
  [INPUT_TYPE.SWITCH]: renderSwitch,
  [INPUT_TYPE.NUMBER]: renderNumberField,
  [INPUT_TYPE.TEXTAREA]: renderTextArea,
  [STATIC_TYPE.HEADER]: renderHeader,
  [STATIC_TYPE.SPACER]: renderSpacer,
  [STATIC_TYPE.DIVIDER]: renderDivider,
};

export const getRenderer = (type: string) => {
  type = type.toLowerCase();
  return (
    renderFunctions[type as keyof typeof renderFunctions] ||
    (() => {
      const error = `Renderer for input "${type}" not found!`;
      console.warn("Input renderer error", error);
      return (
        <div style={{ border: "1px solid red", color: "red" }}>{error}</div>
      );
    })
  );
};
