import { Typography } from "@mui/material";
import { RendererFunction } from "../types/renderer-props";
import { FieldValues } from "react-hook-form";

const renderHeader: RendererFunction<FieldValues> = ({ title }) => {
  return (
    <Typography variant="h5" sx={{ mb: 2 }}>
      {title}
    </Typography>
  );
};

export default renderHeader;
