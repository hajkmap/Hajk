import { createPortal } from "react-dom";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { Sheet } from "react-modal-sheet";
import { motion, useTransform } from "motion/react";
import { isMobile } from "../utils/IsMobile";

const KEYBOARD_EXPAND_THRESHOLD = 0.4;

// Lets nested components reset the sheet's scroll when content swaps in place.
const WindowSheetScrollContext = createContext({
  scrollToTop: () => {},
});

export const useWindowSheetScroll = () => useContext(WindowSheetScrollContext);

const isTextInput = (el, container) => {
  if (!el) return false;
  if (container && !container.contains(el)) return false;
  return (
    el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable
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
  persistent = false,
  children,
}) => {
  const theme = useTheme();
  const sheetRef = useRef(null);
  const currentSnapIndex = useRef(initialSnap);
  const paddingBottom = useTransform(() => sheetRef.current?.y.get() ?? 0);
  // height = viewport - y so the persistent div exactly covers the visible sheet area.
  const persistentHeight = useTransform(() =>
    Math.max(
      0,
      window.innerHeight - (sheetRef.current?.y?.get() ?? window.innerHeight)
    )
  );
  const [keyboardActive, setKeyboardActive] = useState(false);
  const scrollContainerRef = useRef(null);
  // Measure Sheet.Header height once on mount so the persistent content div
  // can leave a transparent gap over the drag area.
  const [headerHeight, setHeaderHeight] = useState(0);
  const headerCallbackRef = useCallback((node) => {
    if (node) setHeaderHeight(node.getBoundingClientRect().height);
  }, []);

  const handleSnap = useCallback(
    (index) => {
      currentSnapIndex.current = index;
      onSnap?.(index);
    },
    [onSnap]
  );

  const scrollToTop = useCallback(() => {
    // rAF so pending DOM updates are committed before we set scrollTop.
    requestAnimationFrame(() => {
      const container = scrollContainerRef.current;
      if (container) container.scrollTop = 0;
    });
  }, []);

  // Reset scroll on open and on title change (signals content swap).
  useEffect(() => {
    if (!isOpen) return;
    scrollToTop();
  }, [isOpen, title, scrollToTop]);

  const scrollContextValue = useMemo(() => ({ scrollToTop }), [scrollToTop]);

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
    <>
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
              ref={persistent ? headerCallbackRef : undefined}
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
            {persistent ? (
              <div style={{ flex: 1 }} />
            ) : (
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
                <WindowSheetScrollContext.Provider value={scrollContextValue}>
                  {children}
                </WindowSheetScrollContext.Provider>
              </Box>
            )}
          </Sheet.Content>
        </Sheet.Container>
      </Sheet>

      {/* Portal that keeps children mounted even when the Sheet closes. */}
      {persistent &&
        createPortal(
          <motion.div
            style={{
              position: "fixed",
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
              overflow: "hidden",
              pointerEvents: "none",
              zIndex: zIndex + 1,
            }}
          >
            <motion.div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: persistentHeight,
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Transparent gap over Sheet.Header so DragIndicator stays interactive */}
              <div
                style={{
                  height: headerHeight,
                  flexShrink: 0,
                  pointerEvents: "none",
                }}
              />

              {/* position:relative needed so absolutely-positioned plugin shells fill correctly. */}
              <Box
                ref={(node) => {
                  scrollContainerRef.current = node ?? null;
                }}
                className="window-sheet-content"
                sx={{
                  flex: 1,
                  minHeight: 0,
                  position: "relative",
                  pointerEvents: isOpen ? "auto" : "none",
                  backgroundColor: `color-mix(in srgb, ${theme.palette.background.paper} 90%, transparent)`,
                  backdropFilter: "blur(12px)",
                  // Same padding as the non-persistent path so negative-margin layouts stay aligned.
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
            </motion.div>
          </motion.div>,
          document.body
        )}
    </>
  );
};

export default WindowSheet;
