import { Box } from "@mui/material";
import { useCallback, useState, type ReactNode } from "react";

/** The window gets no shorter than this; the page scrolls instead. */
const MIN_HEIGHT = 420;
/** At most this much is left under the window, should more follow it. */
const MAX_BELOW = 160;

/**
 * The editor as a window of its own on large screens, as the services list:
 * the catalog on the left and the content on the right fill it and scroll
 * inside it. It ends where the page fits the screen, so the page itself
 * doesn't scroll; measured, since what is above it varies (help text,
 * alerts). On small screens the columns stack and follow the page.
 */
export default function LayerTreeEditorWindow({
  children,
}: {
  children: ReactNode;
}) {
  const [height, setHeight] = useState<number | null>(null);

  const measureRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    // The page, which keeps its bottom margin under the window.
    const page = node.closest("#main > *") ?? document.body;
    const measure = () => {
      const box = node.getBoundingClientRect();
      const below = Math.min(
        MAX_BELOW,
        Math.max(0, page.getBoundingClientRect().bottom - box.bottom),
      );
      const top = box.top + window.scrollY;
      setHeight(
        Math.max(MIN_HEIGHT, Math.floor(window.innerHeight - top - below)),
      );
    };
    measure();
    // Moves with what is above it, and with the screen.
    const observer = new ResizeObserver(measure);
    observer.observe(document.body);
    if (node.parentElement) observer.observe(node.parentElement);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <Box
      ref={measureRef}
      // Where Ctrl+Z undoes the editor's changes (see useDraftHistory).
      data-layer-tree-editor=""
      sx={{
        display: "grid",
        gap: { xs: 2, lg: 3 },
        gridTemplateColumns: {
          xs: "1fr",
          lg: "minmax(220px, 280px) minmax(0, 1fr)",
        },
        alignItems: { xs: "start", lg: "stretch" },
        height: { lg: height ?? "calc(100vh - 380px)" },
        minHeight: { lg: MIN_HEIGHT },
      }}
    >
      {children}
    </Box>
  );
}
