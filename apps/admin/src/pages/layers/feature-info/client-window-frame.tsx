import { useMemo, useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { Box, Paper, Typography } from "@mui/material";
import { ThemeProvider, createTheme, useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import CloseIcon from "@mui/icons-material/Close";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import IconButton from "@mui/material/IconButton";


export const CLIENT_WINDOW_WIDTH = 400;
export const CLIENT_WINDOW_MIN_WIDTH = 200;
export const CLIENT_WINDOW_BODY_HEIGHT = 480;
export const CLIENT_WINDOW_CHROME_HEIGHT = 50;
export const CLIENT_WINDOW_MIN_HEIGHT = 160;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

function visibleArea(shell: HTMLElement) {
  const bounds =
    shell.offsetParent instanceof HTMLElement ? shell.offsetParent : document.documentElement;
  return { width: bounds.clientWidth, height: bounds.clientHeight };
}

/**
 * Grows from the bottom-right corner. Size is written straight to the elements
 * while the pointer moves, and reported once when the drag ends, so the rest
 * of the page does not re-render on every pixel.
 */
function beginResize(
  event: ReactPointerEvent<HTMLElement>,
  resize: {
    frame: HTMLElement;
    body: HTMLElement;
    width: number;
    height: number;
    onWidth?: (width: number) => void;
    onHeight?: (height: number) => void;
  },
) {
  event.preventDefault();
  event.stopPropagation();
  const handle = event.currentTarget;
  const startX = event.clientX;
  const startY = event.clientY;
  const { frame, body, width: startWidth, height: startHeight, onWidth, onHeight } = resize;
  const shell = frame.closest(".MuiDialog-paper");
  const area =
    shell instanceof HTMLElement
      ? visibleArea(shell)
      : { width: window.innerWidth, height: window.innerHeight };
  const left = shell instanceof HTMLElement ? shell.offsetLeft : 0;
  const top = shell instanceof HTMLElement ? shell.offsetTop : 0;
  const chrome =
    shell instanceof HTMLElement
      ? Math.max(0, shell.offsetHeight - body.offsetHeight)
      : CLIENT_WINDOW_CHROME_HEIGHT;
  const maxWidth = Math.max(1, area.width - left);
  const maxHeight = Math.max(1, area.height - top - chrome);
  let nextWidth = startWidth;
  let nextHeight = startHeight;
  let frameId = 0;
  handle.style.animation = "none";
  handle.style.borderColor = "transparent";
  try {
    handle.setPointerCapture(event.pointerId);
  } catch {
    // A pointer that is already gone cannot be captured. Listeners still follow the drag.
  }
  const paint = () => {
    frameId = 0;
    frame.style.width = `${nextWidth}px`;
    body.style.height = `${nextHeight}px`;
    const shell = frame.closest(".MuiDialog-paper");
    if (shell instanceof HTMLElement) shell.style.width = `${nextWidth}px`;
  };
  const move = (moveEvent: PointerEvent) => {
    nextWidth = Math.round(
      clamp(
        startWidth + (moveEvent.clientX - startX),
        Math.min(CLIENT_WINDOW_MIN_WIDTH, maxWidth),
        maxWidth,
      ),
    );
    nextHeight = Math.round(
      clamp(
        startHeight + (moveEvent.clientY - startY),
        Math.min(CLIENT_WINDOW_MIN_HEIGHT, maxHeight),
        maxHeight,
      ),
    );
    if (frameId === 0) frameId = requestAnimationFrame(paint);
  };
  const stop = () => {
    if (frameId !== 0) cancelAnimationFrame(frameId);
    paint();
    onWidth?.(nextWidth);
    onHeight?.(nextHeight);
    handle.removeEventListener("pointermove", move);
    handle.removeEventListener("pointerup", stop);
    handle.removeEventListener("pointercancel", stop);
  };
  handle.addEventListener("pointermove", move);
  handle.addEventListener("pointerup", stop);
  handle.addEventListener("pointercancel", stop);
}

/** Slides the dialog from the title bar. Position is painted directly, then saved once. */
function beginMove(
  event: ReactPointerEvent<HTMLElement>,
  moveWindow: {
    shell: HTMLElement;
    onMove: (position: { left: number; top: number }) => void;
  },
) {
  event.preventDefault();
  event.stopPropagation();
  const handle = event.currentTarget;
  const startX = event.clientX;
  const startY = event.clientY;
  const { shell, onMove } = moveWindow;
  const startLeft = shell.offsetLeft;
  const startTop = shell.offsetTop;
  let nextLeft = startLeft;
  let nextTop = startTop;
  let frameId = 0;
  const previousCursor = document.body.style.cursor;
  document.body.style.cursor = "move";
  try {
    handle.setPointerCapture(event.pointerId);
  } catch {
    // A pointer that is already gone cannot be captured. Listeners still follow the drag.
  }
  const paint = () => {
    frameId = 0;
    shell.style.left = `${nextLeft}px`;
    shell.style.top = `${nextTop}px`;
  };
  const move = (moveEvent: PointerEvent) => {
    const area = visibleArea(shell);
    const width = shell.offsetWidth;
    const height = shell.offsetHeight;
    nextLeft = Math.round(
      clamp(startLeft + (moveEvent.clientX - startX), 0, Math.max(0, area.width - width)),
    );
    nextTop = Math.round(
      clamp(startTop + (moveEvent.clientY - startY), 0, Math.max(0, area.height - height)),
    );
    if (frameId === 0) frameId = requestAnimationFrame(paint);
  };
  const stop = () => {
    if (frameId !== 0) cancelAnimationFrame(frameId);
    document.body.style.cursor = previousCursor;
    paint();
    onMove({ left: nextLeft, top: nextTop });
    handle.removeEventListener("pointermove", move);
    handle.removeEventListener("pointerup", stop);
    handle.removeEventListener("pointercancel", stop);
  };
  handle.addEventListener("pointermove", move);
  handle.addEventListener("pointerup", stop);
  handle.addEventListener("pointercancel", stop);
}

function ResizeHandle({
  axis,
  label,
  hint = false,
  onPointerDown,
  sx,
}: {
  axis: "x" | "y" | "both";
  label: string;
  hint?: boolean;
  onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
  sx: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
    width?: number;
    height?: number;
    cursor?: string;
  };
}) {
  return (
    <Box
      role="separator"
      aria-orientation={axis === "y" ? "horizontal" : "vertical"}
      aria-label={label}
      onPointerDown={onPointerDown}
      sx={{
        position: "absolute",
        touchAction: "none",
        ...(hint && {
          borderRight: "3px solid",
          borderBottom: "3px solid",
          borderColor: "primary.main",
          animation: "hajk-resize-hint 1s ease-in-out infinite",
          "@keyframes hajk-resize-hint": {
            "0%, 100%": { opacity: 1 },
            "50%": { opacity: 0.15 },
          },
        }),
        ...sx,
      }}
    />
  );
}

interface ClientWindowFrameProps {
  title: string;
  children: ReactNode;
  fill?: boolean;
  width?: number;
  onWidthChange?: (width: number) => void;
  height?: number;
  onHeightChange?: (height: number) => void;
  hintResize?: boolean;
  onClose?: () => void;
  onMove?: (position: { left: number; top: number }) => void;
}

export default function ClientWindowFrame({
  title,
  children,
  fill = false,
  width = CLIENT_WINDOW_WIDTH,
  onWidthChange,
  height = CLIENT_WINDOW_BODY_HEIGHT,
  onHeightChange,
  hintResize = false,
  onClose,
  onMove,
}: ClientWindowFrameProps) {
  const { t } = useTranslation();
  const resizable = Boolean(onWidthChange && onHeightChange);
  const frameRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const mode = useTheme().palette.mode;
  const clientTheme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          action: { active: mode === "dark" ? "#fff" : "rgba(0, 0, 0, 0.87)" },
        },
        shape: { borderRadius: 8 },
      }),
    [mode],
  );

  return (
    <ThemeProvider theme={clientTheme}>
      <Paper
        ref={frameRef}
        data-infoclick-preview=""
        elevation={24}
        sx={{
          bgcolor: "background.paper",
          color: "text.primary",
          position: "relative",
          width: resizable ? width : "100%",
          maxWidth: resizable ? "none" : CLIENT_WINDOW_WIDTH,
          minWidth: 0,
          mx: resizable ? 0 : "auto",
          overflow: "hidden",
          ...(fill && {
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
          }),
          '& a:not([class*="Mui"])': { color: "primary.light" },
        }}
      >
        <Box
          component="header"
          aria-hidden={onClose ? undefined : true}
          aria-label={onMove ? t("layers.featureInfo.moveWindow") : undefined}
          onPointerDown={(event) => {
            if (!onMove) return;
            const target = event.target;
            if (target instanceof Element && target.closest("button")) return;
            const frame = frameRef.current;
            const shell = frame?.closest(".MuiDialog-paper");
            if (!(shell instanceof HTMLElement)) return;
            beginMove(event, { shell, onMove });
          }}
          sx={{
            px: 2,
            py: 1,
            minHeight: 46,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: 4,
            borderColor: "primary.main",
            userSelect: "none",
            ...(onMove && { cursor: "move", touchAction: "none" }),
          }}
        >
          <Typography variant="button" noWrap>
            {title}
          </Typography>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              flexShrink: 0,
              color: "action.active",
            }}
          >
            <IconButton size="small" tabIndex={-1} aria-hidden sx={{ pointerEvents: "none" }}>
              <FullscreenExitIcon />
            </IconButton>
            {onClose ? (
              <IconButton size="small" aria-label={title} onClick={onClose} color="inherit">
                <CloseIcon />
              </IconButton>
            ) : (
              <IconButton size="small" tabIndex={-1} aria-hidden sx={{ pointerEvents: "none" }}>
                <CloseIcon />
              </IconButton>
            )}
          </Box>
        </Box>
        <Box
          ref={bodyRef}
          sx={{
            p: "10px",
            overflowX: "hidden",
            overflowY: "auto",
            minWidth: 0,
            maxWidth: "100%",
            overflowWrap: "anywhere",
            "& img, & table, & pre": { maxWidth: "100%" },
            "& pre, & code": { whiteSpace: "pre-wrap" },
            ...(resizable
              ? { height, flexShrink: 0 }
              : fill
                ? { flex: 1, minHeight: 0 }
                : { height: CLIENT_WINDOW_BODY_HEIGHT, flexShrink: 0 }),
            typography: "body1",
            '& :where(:not([class*="Mui"]))': {
              margin: "revert",
              padding: "revert",
              font: "revert",
            },
            "& img": { display: "revert" },
          }}
        >
          {children}
        </Box>
        {resizable && (
          <ResizeHandle
            axis="both"
            label={title}
            hint={hintResize}
            onPointerDown={(event) => {
              const frame = frameRef.current;
              const body = bodyRef.current;
              if (!frame || !body) return;
              beginResize(event, {
                frame,
                body,
                width,
                height,
                onWidth: onWidthChange,
                onHeight: onHeightChange,
              });
            }}
            sx={{ right: 0, bottom: 0, width: 18, height: 18, cursor: "nwse-resize" }}
          />
        )}
      </Paper>
    </ThemeProvider>
  );
}
