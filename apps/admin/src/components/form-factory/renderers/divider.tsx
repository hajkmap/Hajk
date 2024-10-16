import { Divider } from "@mui/material";
import { RenderFunction } from "../types/renderer-props";
import { FieldValues } from "react-hook-form";

const renderDivider: RenderFunction<FieldValues> = ({ title }) => {
  return <Divider>{title}</Divider>;
};

export default renderDivider;
