import { Box } from "@mui/material";
import { useContext, useSyncExternalStore } from "react";

import { LayerTreePlaceLinesContext } from "./layer-tree-place-lines";

const subscribeToNothing = () => () => undefined;

/** Above the row before it, under it after it or (inset) in it. */
export function LayerTreePlaceLine({
  nodeId,
  depth,
}: {
  nodeId: string;
  depth: number;
}) {
  const lines = useContext(LayerTreePlaceLinesContext);
  const part = useSyncExternalStore(
    lines?.hover.subscribe ?? subscribeToNothing,
    () => {
      const hover = lines?.hover.get();
      return hover?.id === nodeId ? hover.part : null;
    },
  );
  const line = lines && part ? lines.lineAt(nodeId, part) : null;
  if (!line) return null;

  return (
    <Box
      aria-hidden
      sx={{
        position: "absolute",
        left: `${(line.part === "into" ? depth + 1 : depth) * 24 + 8}px`,
        right: 8,
        ...(line.part === "before" ? { top: -1 } : { bottom: -1 }),
        height: 3,
        borderRadius: 1,
        bgcolor: line.ok ? "primary.main" : "error.main",
        zIndex: 1,
      }}
    />
  );
}
