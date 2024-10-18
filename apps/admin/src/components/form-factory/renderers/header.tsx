import { Typography } from "@mui/material";
import { RenderFunction } from "../types/render";
import { FieldValues } from "react-hook-form";

const renderHeader: RenderFunction<FieldValues> = ({ title }) => {
  return (
    <Typography variant="h5" sx={{ mb: 2 }}>
      {title}
    </Typography>
  );
};

export default renderHeader;
