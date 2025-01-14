const defaultSizeForComponents = "small";

// List of components that should have a default size set
const defaultSizedComponents = [
  "MuiButton",
  "MuiTextField",
  "MuiSelect",
  "MuiCheckbox",
  "MuiRadio",
  "MuiFormControlLabel",
  "MuiIconButton",
  "MuiInput",
  "MuiInputBase",
  "MuiInputLabel",
  "MuiOutlinedInput",
  "MuiFilledInput",
  "MuiSwitch",
  "MuiSlider",
  "MuiAlert",
  "MuiToggleButton",
];

const defaultSizeComponentObject: Record<
  string,
  { defaultProps: { size: string } }
> = {};

// Create a default size for each component
defaultSizedComponents.forEach((component) => {
  defaultSizeComponentObject[component] = {
    defaultProps: {
      size: defaultSizeForComponents,
    },
  };
});

export default defaultSizeComponentObject;
