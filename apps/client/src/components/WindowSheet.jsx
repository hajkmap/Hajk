import { useCallback, useEffect, useRef, useState } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { Sheet } from "react-modal-sheet";
import { useTransform } from "motion/react";
import { isMobile } from "../utils/IsMobile";

const KEYBOARD_EXPAND_THRESHOLD = 0.4;

const isTextInput = (el, container) => {
  if (!el) return false;
  if (container && !container.contains(el)) return false;
  return (
    el.tagName === "INPUT" ||
    el.tagName === "TEXTAREA" ||
    el.isContentEditable
  );
};

const WindowSheet = ({
  isOpen,
  onClose,
  title,
  snapPoints = [0, 0.4, 0.7, 1],
  initialSnap = 1,
  zIndex = 1198,
  onSnap,
  avoidKeyboard = true,
  disablePadding = false,
  globalObserver,
  minimizeOnFocusMapClick = false,
  children,
}) => {
  const theme = useTheme();
  const sheetRef = useRef(null);
  const currentSnapIndex = useRef(initialSnap);
  const paddingBottom = useTransform(() => sheetRef.current?.y.get() ?? 0);
  const [keyboardActive, setKeyboardActive] = useState(false);
  const scrollContainerRef = useRef(null);

  const handleSnap = useCallback(
    (index) => {
      currentSnapIndex.current = index;
      onSnap?.(index);
    },
    [onSnap]
  );

  useEffect(() => {
    if (!isMobile || !isOpen || !avoidKeyboard) return;

    const onFocusIn = (e) => {
      if (!isTextInput(e.target, scrollContainerRef.current)) return;
      setKeyboardActive(true);

      const cur = currentSnapIndex.current;
      const currentSnapValue = snapPoints[cur];
      const canExpandFromCurrentSnap =
        typeof currentSnapValue === "number" &&
        currentSnapValue > 0 &&
        currentSnapValue <= KEYBOARD_EXPAND_THRESHOLD;
      if (!canExpandFromCurrentSnap) return;

      // Move only one snap step up to reveal focused input without forcing full-screen.
      const nextSnap = Math.min(cur + 1, Math.max(0, snapPoints.length - 2));
      if (nextSnap > cur) {
        sheetRef.current?.snapTo(nextSnap);
      }
      setTimeout(() => {
        const sc = scrollContainerRef.current;

        // Just ignore if it has tabs like Print plugin etc, the textfield will not be visible (placed under the tabs).
        // Will not add more logic to handle every occation of this, maybe newer versions of
        // the Sheet component will handle this better/correct.
        if (!sc || sc.querySelector(".MuiTabs-fixed")) return;

        const targetRect = e.target.getBoundingClientRect();
        const offset = targetRect.top - sc.getBoundingClientRect().top;
        sc.scrollTo({ top: Math.abs(offset) - 4, behavior: "smooth" });
      }, 305);
    };

    const onFocusOut = (e) => {
      if (isTextInput(e.target, scrollContainerRef.current))
        setKeyboardActive(false);
    };

    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      setKeyboardActive(false);
    };
  }, [avoidKeyboard, isOpen, snapPoints]);

  useEffect(() => {
    if (!minimizeOnFocusMapClick || !globalObserver) return;
    const sub = globalObserver.subscribe("core.focusMapClick", () => {
      if (isOpen) {
        sheetRef.current?.snapTo(1);
      }
    });
    return () => sub.unsubscribe();
  }, [globalObserver, isOpen, minimizeOnFocusMapClick]);

  return (
    <Sheet
      ref={sheetRef}
      isOpen={isOpen}
      onClose={onClose}
      snapPoints={snapPoints}
      initialSnap={initialSnap}
      detent="full"
      avoidKeyboard={false}
      disableScrollLocking
      dragVelocityThreshold={1500}
      dragCloseThreshold={1.5}
      onSnap={handleSnap}
      style={{ zIndex }}
    >
      <Sheet.Container
        style={{
          backgroundColor: `color-mix(in srgb, ${theme.palette.background.paper} 90%, transparent)`,
          backdropFilter: "blur(12px)",
          color: theme.palette.text.primary,
          boxShadow: theme.shadows[24],
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
        }}
      >
        <Sheet.Header>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              paddingTop: 1,
              paddingBottom: 0,
            }}
          >
            <Sheet.DragIndicator />
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 600, mt: 0.5, mb: 1 }}
            >
              {title}
            </Typography>
            <div
              style={{
                height: "2px",
                width: "100%",
                backgroundColor: theme.palette.primary.main,
              }}
            />
          </Box>
        </Sheet.Header>
        <Sheet.Content disableDrag scrollStyle={{ paddingBottom }}>
          <Box
            className="window-sheet-content"
            ref={(node) => {
              scrollContainerRef.current = node?.parentElement ?? null;
            }}
            sx={{
              position: "relative",
              // content detent sizes the sheet from children; floor so abs-loaded UIs (e.g. Street View) don't collapse
              minHeight: isMobile
                ? keyboardActive
                  ? "200%"
                  : "100%"
                : undefined,
              padding: disablePadding ? 0 : 2,
              userSelect: "none",
              outline: "none",
              "& a:not([class*='Mui'])": {
                color: theme.palette.primary.light,
              },
            }}
          >
            {children}
          </Box>
        </Sheet.Content>
      </Sheet.Container>
    </Sheet>
  );
};

export default WindowSheet;
