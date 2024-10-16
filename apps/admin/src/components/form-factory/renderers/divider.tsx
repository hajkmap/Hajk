import { Divider } from "@mui/material";
import { RendererFunction } from "../types/renderer-props";
import { FieldValues } from "react-hook-form";

const renderDivider: RendererFunction<FieldValues> = ({ title }) => {
  return <Divider>{title}</Divider>;
};

export default renderDivider;
