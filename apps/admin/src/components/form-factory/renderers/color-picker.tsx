import { FormControlLabel } from "@mui/material";
import { RenderFunction } from "../types/render";
import { FieldValues } from "react-hook-form";
import { ColorResult, SketchPicker } from "react-color"; // Import ColorResult

const renderColorPicker: RenderFunction<FieldValues> = ({ field, title }) => {
  return (
    <FormControlLabel
      labelPlacement="top"
      sx={{
        marginLeft: 0,
        textAlign: "left",
        "& > span": { alignSelf: "flex-start" },
      }}
      control={
        <SketchPicker
          color={(field?.value as string) || "#000"}
          onChange={(colorResult: ColorResult) => {
            // My brain currently doesn't know how to fix below.
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            field?.onChange(colorResult.hex);
          }}
        />
      }
      label={title ?? ""}
    />
  );
};
export default renderColorPicker;
