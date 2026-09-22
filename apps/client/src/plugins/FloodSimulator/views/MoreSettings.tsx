import { useState, type MouseEvent } from "react";

import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";

import BaseDialog from "components/Dialog/BaseDialog";
import HajkToolTip from "components/HajkToolTip";

import {
  ANIMATION_DURATION_MAX_LIMIT,
  ANIMATION_DURATION_MIN_S,
  UI_STRINGS,
  WATER_LEVEL_MAX_LIMIT,
} from "../constants";
import SliderNumberField from "./SliderNumberField";

interface MoreSettingsProps {
  minLevel: number;
  maxLevel: number;
  levelStep: number;
  onMaxLevelChange: (maxLevel: number) => void;
  durationMaxSec: number;
  onDurationMaxChange: (seconds: number) => void;
}

function MoreSettings({
  minLevel,
  maxLevel,
  levelStep,
  onMaxLevelChange,
  durationMaxSec,
  onDurationMaxChange,
}: MoreSettingsProps) {
  const [open, setOpen] = useState(false);
  const maxLevelMin = Math.min(
    maxLevel,
    Number((minLevel + Math.max(levelStep, 0.01)).toFixed(2))
  );
  const maxLevelLimit = Math.max(WATER_LEVEL_MAX_LIMIT, maxLevel);
  const durationMaxMin = Math.min(durationMaxSec, ANIMATION_DURATION_MIN_S);
  const durationMaxLimit = Math.max(
    ANIMATION_DURATION_MAX_LIMIT,
    durationMaxSec
  );

  const close = () => {
    setOpen(false);
  };

  return (
    <>
      <HajkToolTip title={UI_STRINGS.moreSettings}>
        <IconButton
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-label={UI_STRINGS.moreSettings}
          edge="end"
          onClick={() => {
            setOpen(true);
          }}
          size="small"
        >
          <SettingsIcon fontSize="small" />
        </IconButton>
      </HajkToolTip>
      <BaseDialog
        fullWidth
        maxWidth="xs"
        onClose={close}
        onMouseDown={(event: MouseEvent<HTMLDivElement>) => {
          event.stopPropagation();
        }}
        open={open}
      >
        <DialogTitle>{UI_STRINGS.moreSettingsTitle}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <SliderNumberField
              id="flood-simulator-max-level-label"
              label={UI_STRINGS.maxLevelLabel}
              inputAriaLabel={UI_STRINGS.maxLevelAriaLabel}
              value={maxLevel}
              onChange={onMaxLevelChange}
              min={maxLevelMin}
              max={maxLevelLimit}
              step={levelStep}
              decimals={2}
              unit="m"
              inputMode="decimal"
            />
            <SliderNumberField
              id="flood-simulator-max-duration-label"
              label={UI_STRINGS.maxAnimationDurationLabel}
              inputAriaLabel={UI_STRINGS.maxAnimationDurationAriaLabel}
              value={durationMaxSec}
              onChange={onDurationMaxChange}
              min={durationMaxMin}
              max={durationMaxLimit}
              step={1}
              decimals={0}
              unit="s"
              inputMode="numeric"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={close}>{UI_STRINGS.close}</Button>
        </DialogActions>
      </BaseDialog>
    </>
  );
}

export default MoreSettings;
