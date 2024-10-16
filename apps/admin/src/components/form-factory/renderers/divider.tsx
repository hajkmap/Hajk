import { Divider } from "@mui/material";
import { ReactElement } from "react";
import { RendererProps } from "../types/renderer-props";
import { FieldValues } from "react-hook-form";

const renderDivider = <TFieldValues extends FieldValues>({
  title,
}: RendererProps<TFieldValues>): ReactElement | null => {
  return <Divider>{title}</Divider>;
};

export default renderDivider;
