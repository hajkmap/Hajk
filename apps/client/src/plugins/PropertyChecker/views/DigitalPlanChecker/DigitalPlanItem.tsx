import React, { useId } from "react";

import {
  Box,
  Checkbox,
  Collapse,
  Divider,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import HajkToolTip from "components/HajkToolTip";

import type {
  DigitalPlanItemProps,
  ControlledRegulation,
  DigitalPlanDescriptionAttribute,
} from "../../types";
import { usePropertyCheckerContext } from "../../context";

const DigitalPlanItem = ({
  feature,
  controlledRegulations,
  setControlledRegulations,
  options,
  digitalPlanKey,
  regulationNotes,
  setRegulationNotes,
  useType,
}: DigitalPlanItemProps) => {
  // Used to keep track of the expansion area below the main layer item
  const [expanded, setExpanded] = React.useState(false);
  const handleExpandClick = () => setExpanded(!expanded);

  const id = useId();
  const regulationName = feature.get(options.digitalPlanItemTitleAttribute);

  // Contents of an item's subheader is a bit special: we must get it twice.
  // 1. To get React Elements that'll be rendered into the `subheader` prop of the card.
  //    This allows for nice formatting (bold header, new lines, etc.).
  // 2. To get the value as a plain string. This is used in the Report dialog.
  const regulationCaptionAsElement =
    options.digitalPlanItemDescriptionAttributes
      .map((a: DigitalPlanDescriptionAttribute, i: number) =>
        feature.get(a.column) || a.fallbackValue ? (
          <React.Fragment key={i}>
            <b>{a.label}: </b>
            {feature.get(a.column) ?? a?.fallbackValue}
            <br />
          </React.Fragment>
        ) : null
      )
      .filter((a: React.ReactNode) => a !== null);

  const regulationCaptionAsArray = options.digitalPlanItemDescriptionAttributes
    .map((a: DigitalPlanDescriptionAttribute) =>
      feature.get(a.column) || a.fallbackValue
        ? `${a.label}: ${feature.get(a.column) ?? a?.fallbackValue}`
        : null
    )
    .filter((a: string | null): a is string => a !== null);

  // Define an object that will be used when keeping track
  // of user-selected layers that should be printed inside the
  // Report dialog.
  const selectionFormat = {
    id, // We want to distinguish by something more unique than merely the caption.
    regulationName,
    regulationCaptionAsElement,
    regulationCaptionAsArray,
    digitalPlanKey,
    useType,
  };

  const { showTooltips } = usePropertyCheckerContext();

  const isSelected = () =>
    controlledRegulations.filter(
      (l: ControlledRegulation) => l.id === selectionFormat.id
    ).length > 0;

  const handleLayerNoteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRegulationNotes({ ...regulationNotes, ...{ [id]: e.target.value } });
  };

  return (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          gap: 1,
          py: 0.75,
          px: 1,
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2">{regulationName}</Typography>
          {regulationCaptionAsElement.length > 0 && (
            <Typography
              variant="caption"
              color="text.secondary"
              component="div"
            >
              {regulationCaptionAsElement}
            </Typography>
          )}
        </Box>
        {options.enableDigitalPlansReport && (
          <Box
            sx={{
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              mt: -0.5,
            }}
          >
            <HajkToolTip
              title={
                showTooltips ? "Inkludera planbestämmelsen i rapport" : ""
              }
            >
              <Checkbox
                size="small"
                onChange={() => {
                  setControlledRegulations((prev: ControlledRegulation[]) => {
                    if (isSelected()) {
                      return prev.filter(
                        (l: ControlledRegulation) => l.id !== selectionFormat.id
                      );
                    } else {
                      return [...prev, selectionFormat];
                    }
                  });
                }}
                checked={isSelected()}
              />
            </HajkToolTip>
            <HajkToolTip
              title={showTooltips ? "Lägg till notering" : ""}
            >
              <IconButton
                size="small"
                onClick={handleExpandClick}
                aria-expanded={expanded}
                aria-label="Visa noteringar"
              >
                <ExpandMoreIcon
                  sx={{
                    transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                    transition: (theme) =>
                      theme.transitions.create("transform", {
                        duration: theme.transitions.duration.shortest,
                      }),
                  }}
                />
              </IconButton>
            </HajkToolTip>
          </Box>
        )}
      </Box>
      <Collapse in={expanded} timeout="auto">
        <Box sx={{ px: 2, pb: 1.5 }}>
          <TextField
            label="Notering"
            multiline
            fullWidth
            size="small"
            minRows={1}
            maxRows={4}
            onChange={handleLayerNoteChange}
            value={regulationNotes?.id}
          />
        </Box>
      </Collapse>
      <Divider />
    </>
  );
};

export default DigitalPlanItem;
