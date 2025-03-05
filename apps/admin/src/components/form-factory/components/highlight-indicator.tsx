import { Box, keyframes } from "@mui/material";
import HighlightIcon from "@mui/icons-material/Forward";

interface HighlightIndicatorProps {
  highlight: boolean;
  animate?: boolean;
}

const pulseAnimation = keyframes`
  0% { transform: scale(0.95) rotate(15deg) translateX(0px) translateY(0px); }
  50% { transform: scale(1.05) rotate(15deg) translateX(-2px) translateY(-1px); }
  100% { transform: scale(0.95) rotate(15deg) translateX(0px) translateY(0px); }
`;

export const highlightColor = "rgb(45, 109, 45)";

function HighlightIndicator({
  highlight,
  animate = false,
}: HighlightIndicatorProps) {
  const styles = {
    container: {
      position: "absolute",
      display: "block",
      top: "calc(50% - 18px)",
      left: "-18px",
      width: "20px",
      height: "20px",
      color: highlightColor,
      borderRadius: "100%",
      pointerEvents: "none",
      transition: "opacity 250ms ease-in-out",
      opacity: highlight ? 1.0 : 0.0,
      ...(!animate && { transform: "rotate(15deg)" }),
      ...(animate && {
        animation: `${pulseAnimation} 1000ms infinite ease-in-out`,
        animationPlayState: highlight ? "running" : "paused",
      }),
    },
  };

  return (
    <Box sx={styles.container}>
      <HighlightIcon sx={{ width: "auto", height: "auto" }} />
    </Box>
  );
}

export default HighlightIndicator;
