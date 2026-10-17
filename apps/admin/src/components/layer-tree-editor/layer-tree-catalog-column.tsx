import { Box } from "@mui/material";
import type { ReactNode } from "react";

import { EDITOR_COLUMN } from "./layer-tree-layout";

/**
 * The catalog's column beside a tree: as tall as the editor's window on
 * large screens, with the catalog's list scrolling inside it.
 */
export default function LayerTreeCatalogColumn({
  children,
}: {
  children: ReactNode;
}) {
  return <Box sx={EDITOR_COLUMN}>{children}</Box>;
}
