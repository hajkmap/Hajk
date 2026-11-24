import { useRef, useState } from "react";
import type { ReactNode } from "react";
import type { ExtraProps } from "react-markdown";
import { ButtonBase, IconButton } from "@mui/material";
import { styled } from "@mui/material/styles";
import KeyboardArrowLeft from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";

// With more slides than this, the dots take too much space.
const MAX_DOTS = 8;

interface CarouselProps {
  children?: ReactNode;
  slideCount: number;
}

interface ImageCarouselProps extends ExtraProps {
  children?: ReactNode;
  "data-key"?: string;
}

const Root = styled("div")({
  position: "relative",
  marginBottom: "1.1rem",
});

const Track = styled("div")({
  display: "flex",
  overflowX: "auto",
  overflowY: "hidden",
  scrollSnapType: "x mandatory",
  scrollBehavior: "smooth",
  overscrollBehaviorX: "contain",
  // Needed because body only allows pan-y, see index.css.
  touchAction: "pan-x pan-y",
  scrollbarWidth: "none",
  "&::-webkit-scrollbar": { display: "none" },
  "@media (prefers-reduced-motion: reduce)": { scrollBehavior: "auto" },
  "& > *": {
    flex: "0 0 100%",
    minWidth: 0,
    scrollSnapAlign: "start",
    scrollSnapStop: "always",
  },
  "& figure": { margin: 0 },
  // The max height keeps portrait images from taking over the window.
  "& img": {
    display: "block",
    width: "100%",
    height: "auto",
    maxHeight: 400,
    objectFit: "contain",
  },
  // Captions
  "& p, & figcaption": { marginTop: 6, marginBottom: 0 },
});

// Placed over the image, as the controls can be out of view on mobile.
const Counter = styled("div")(({ theme }) => ({
  position: "absolute",
  top: theme.spacing(1),
  right: theme.spacing(1),
  padding: theme.spacing(0.25, 1),
  borderRadius: theme.spacing(1.5),
  color: "#fff",
  backgroundColor: "rgba(0, 0, 0, 0.7)",
  // Makes the badge stand out from dark images and the dark theme.
  border: "1px solid rgba(255, 255, 255, 0.7)",
  fontSize: "0.75rem",
  pointerEvents: "none",
}));

const Controls = styled("div")({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
});

const Dots = styled("div")({ display: "flex" });

// The button is larger than the visible dot, to be easy to hit on touch screens.
const Dot = styled(ButtonBase)(({ theme }) => ({
  width: 24,
  height: 24,
  borderRadius: "50%",
  "&::before": {
    content: '""',
    width: 8,
    height: 8,
    borderRadius: "50%",
    backgroundColor: theme.palette.action.disabled,
  },
  "&[aria-current]::before": {
    backgroundColor: theme.palette.primary.main,
  },
  "&.Mui-focusVisible": {
    backgroundColor: theme.palette.action.focus,
  },
}));

const Carousel = ({ children, slideCount }: CarouselProps) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(0);
  const hasMultipleSlides = slideCount > 1;

  const handleScroll = () => {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    const step = Math.round(track.scrollLeft / track.clientWidth);
    setActiveStep(Math.min(Math.max(step, 0), slideCount - 1));
  };

  const goTo = (step: number) => {
    const track = trackRef.current;
    track?.scrollTo({ left: step * track.clientWidth });
  };

  return (
    <Root
      className="hajk-carousel"
      role="group"
      aria-roledescription="karusell"
      aria-label="Bilder"
    >
      <Track ref={trackRef} onScroll={handleScroll}>
        {children}
      </Track>
      {hasMultipleSlides && (
        <>
          <Counter>{`${activeStep + 1} / ${slideCount}`}</Counter>
          <Controls>
            <IconButton
              aria-label="Föregående bild"
              disabled={activeStep === 0}
              onClick={() => goTo(activeStep - 1)}
            >
              <KeyboardArrowLeft />
            </IconButton>
            {slideCount <= MAX_DOTS && (
              <Dots>
                {Array.from({ length: slideCount }, (_, step) => step).map(
                  (step) => (
                    <Dot
                      key={step}
                      aria-label={`Visa bild ${step + 1}`}
                      aria-current={step === activeStep ? "true" : undefined}
                      onClick={() => goTo(step)}
                    />
                  )
                )}
              </Dots>
            )}
            <IconButton
              aria-label="Nästa bild"
              disabled={activeStep === slideCount - 1}
              onClick={() => goTo(activeStep + 1)}
            >
              <KeyboardArrowRight />
            </IconButton>
          </Controls>
        </>
      )}
    </Root>
  );
};

/**
 * Renders the <hajk-carousel> element created by rehypeCarousel.
 * The key resets the carousel to its first image when another feature is shown.
 */
const ImageCarousel = ({
  node,
  children,
  "data-key": dataKey,
}: ImageCarouselProps) => (
  <Carousel key={dataKey} slideCount={node?.children.length ?? 0}>
    {children}
  </Carousel>
);

export default ImageCarousel;
