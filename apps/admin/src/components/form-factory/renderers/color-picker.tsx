import { FormControlLabel } from "@mui/material";
import { RenderFunction } from "../types/render";
import { FieldValues } from "react-hook-form";
import { ColorResult, SketchPicker } from "react-color"; // Import ColorResult

const renderColorPicker: RenderFunction<FieldValues> = ({ field, title }) => {
  const color: unknown = field?.value;

  let isRGBColor = false;

  if (color) {
    // If the color is an object, check if it has r, g, and b properties.
    // IMPORTANT! Make sure its a correct defaultValue in the form, hex if it should be hex and rbg if it should be rgb.
    // If the color is not an object, it will be treated as a string, AKA hex in the case.
    isRGBColor =
      typeof color === "object" && "r" in color && "g" in color && "b" in color;
  }

  return (
    <FormControlLabel
      labelPlacement="top"
      label={title ?? ""}
      sx={{
        marginLeft: 0,
        textAlign: "left",
        "& > span": { alignSelf: "flex-start" },
      }}
      control={
        <SketchPicker
          color={(field?.value as string) || "#000"}
          onChange={(colorResult: ColorResult) => {
            // if the color is an rgb object make sure to return the same type of object.
            // This way the color picker will update the value correctly in the form.

            // My brain currently doesn't know how to fix below.
            if (isRGBColor) {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              field?.onChange(colorResult?.rgb || { r: 0, g: 0, b: 0 });
            } else {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              field?.onChange(colorResult?.hex || "#000");
            }
          }}
        />
      }
    />
  );
};
export default renderColorPicker;
