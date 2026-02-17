import React, { useId } from "react";
import { styled } from "@mui/material/styles";

import {
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  Collapse,
  IconButton,
  TextField,
} from "@mui/material";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import type { IconButtonProps } from "@mui/material";
import type {
  DigitalPlanItemProps,
  ControlledRegulation,
  DigitalPlanDescriptionAttribute,
} from "../../types";

interface ExpandMoreProps extends IconButtonProps {
  expand: boolean;
}

const ExpandMore = styled(({ expand: _expand, ...other }: ExpandMoreProps) => (
  <IconButton {...other} />
))(({ theme }) => ({
  transform: "rotate(180deg)",
  marginLeft: "auto",
  transition: theme.transitions.create("transform", {
    duration: theme.transitions.duration.shortest,
  }),
  variants: [
    {
      props: ({ expand }: ExpandMoreProps) => !expand,
      style: {
        transform: "rotate(0deg)",
      },
    },
  ],
}));

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

  const isSelected = () =>
    controlledRegulations.filter(
      (l: ControlledRegulation) => l.id === selectionFormat.id
    ).length > 0;

  const handleLayerNoteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRegulationNotes({ ...regulationNotes, ...{ [id]: e.target.value } });
  };

  return (
    <Card variant="outlined">
      <CardHeader
        title={regulationName}
        subheader={regulationCaptionAsElement}
        avatar={
          <>
            {/* Empty, in order to retain same CardHeader layout as for the Check Layer view */}
          </>
        }
        action={
          options.enableDigitalPlansReport && (
            <>
              <Checkbox
                onChange={() => {
                  setControlledRegulations((prev: ControlledRegulation[]) => {
                    // If layer is already selected using the checkbox…
                    if (isSelected()) {
                      // … let's uncheck the box by the removing element with current layer's ID.
                      return prev.filter(
                        (l: ControlledRegulation) => l.id !== selectionFormat.id
                      );
                    } else {
                      // Else, let's check the box by adding the new element.
                      return [...prev, selectionFormat];
                    }
                  });
                }}
                checked={isSelected()}
              />
              <ExpandMore
                expand={expanded}
                onClick={handleExpandClick}
                aria-expanded={expanded}
                aria-label="Visa noteringar"
              >
                <ExpandMoreIcon />
              </ExpandMore>
            </>
          )
        }
      />
      <Collapse in={expanded} timeout="auto">
        <CardContent>
          <TextField
            label="Notering"
            multiline
            fullWidth
            size="small"
            maxRows={4}
            onChange={handleLayerNoteChange}
            value={regulationNotes?.id}
          />
        </CardContent>
      </Collapse>
    </Card>
  );
};

export default DigitalPlanItem;
