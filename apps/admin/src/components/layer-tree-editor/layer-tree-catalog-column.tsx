import { Box } from "@mui/material";
import type { ReactNode } from "react";

/** Same offset as the page's sticky save panel (FormActionPanel). */
const STICKY_TOP = 100;

/**
 * The catalog's column beside a tree. On large screens it is as tall as the
 * tree (at least MIN_HEIGHT) and follows along when a long tree is scrolled,
 * filling the window's height. The catalog itself doesn't make the row
 * taller, so a collapsed tree keeps it at its minimum.
 */
export default function LayerTreeCatalogColumn({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Box
      sx={{
        position: "relative",
        alignSelf: "stretch",
        minHeight: { lg: 480 },
      }}
    >
      <Box sx={{ position: { lg: "absolute" }, inset: { lg: 0 } }}>
        <Box
          sx={{
            position: { lg: "sticky" },
            top: { lg: STICKY_TOP },
            height: { lg: "100%" },
            maxHeight: { lg: `calc(100vh - ${STICKY_TOP + 16}px)` },
            display: "flex",
            flexDirection: "column",
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
