import { RenderFunction } from "../types/render";
import { FieldValues } from "react-hook-form";
import { isValidElement } from "react";

const renderUnmanagedElement: RenderFunction<FieldValues> = ({ element }) => {
  return isValidElement(element) ? element : null;
};

export default renderUnmanagedElement;
