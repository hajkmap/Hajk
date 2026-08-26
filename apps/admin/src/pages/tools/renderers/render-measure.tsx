import { Control, FieldValues } from "react-hook-form";
import { Tool } from "../../../api/tools";

interface MeasureRendererProps {
  tool: Tool;
  control?: Control<FieldValues>;
}

/** Placement, active, and window size are managed per-map in map-tools-list. */
export default function MeasureRenderer(_props: MeasureRendererProps) {
  return null;
}
