import { Typography } from "@mui/material";
import { RendererProps } from "../types/renderer-props";
import { FieldValues } from "react-hook-form";
import { ReactElement } from "react";

const renderHeader = <TFieldValues extends FieldValues>({
  title,
}: RendererProps<TFieldValues>): ReactElement | null => {
  return (
    <Typography variant="h5" sx={{ mb: 2 }}>
      {title}
    </Typography>
  );
};

export default renderHeader;
