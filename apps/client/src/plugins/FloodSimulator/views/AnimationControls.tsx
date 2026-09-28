import { Button, Stack } from "@mui/material";
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import RotateLeftOutlinedIcon from "@mui/icons-material/RotateLeftOutlined";

import HajkToolTip from "components/HajkToolTip";

import { UI_STRINGS } from "../constants";

interface AnimationControlsProps {
  animating: boolean;
  onToggle: () => void;
  onReset: () => void;
}

function AnimationControls({
  animating,
  onToggle,
  onReset,
}: AnimationControlsProps) {
  return (
    <Stack direction="row" spacing={1} sx={{ pb: 1 }}>
      <HajkToolTip
        title={animating ? UI_STRINGS.pauseTooltip : UI_STRINGS.animateTooltip}
      >
        <Button
          fullWidth
          onClick={onToggle}
          size="small"
          startIcon={animating ? <PauseIcon /> : <PlayArrowIcon />}
          variant="contained"
        >
          {animating ? UI_STRINGS.pause : UI_STRINGS.animate}
        </Button>
      </HajkToolTip>
      <HajkToolTip title={UI_STRINGS.resetTooltip}>
        <Button
          fullWidth
          onClick={onReset}
          size="small"
          startIcon={<RotateLeftOutlinedIcon />}
          variant="outlined"
        >
          {UI_STRINGS.reset}
        </Button>
      </HajkToolTip>
    </Stack>
  );
}

export default AnimationControls;
