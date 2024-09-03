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

const ExpandMore = styled((props) => {
  const { expand, ...other } = props;
  return <IconButton {...other} />;
})(({ theme, expand }) => ({
  transform: !expand ? "rotate(0deg)" : "rotate(180deg)",
  marginLeft: "auto",
  transition: theme.transitions.create("transform", {
    duration: theme.transitions.duration.shortest,
  }),
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
}) => {
  // Used to keep track of the expansion area below the main layer item
  const [expanded, setExpanded] = React.useState(false);
  const handleExpandClick = () => setExpanded(!expanded);

  const id = useId();
  const regulationName = feature.get(options.digitalPlanItemTitleAttribute);
  const regulationCaption = feature.get(
    options.digitalPlanItemDescriptionAttribute
  );

  // Define an object that will be used when keeping track
  // of user-selected layers that should be printed inside the
  // Report dialog.
  const selectionFormat = {
    id, // We want to distinguish by something more unique than merely the caption.
    regulationName,
    regulationCaption,
    digitalPlanKey,
    useType,
  };

  const isSelected = () =>
    controlledRegulations.filter((l) => l.id === selectionFormat.id).length > 0;

  const handleLayerNoteChange = (e) => {
    setRegulationNotes({ ...regulationNotes, ...{ [id]: e.target.value } });
  };

  return (
    <Card variant="outlined">
      <CardHeader
        title={regulationName}
        subheader={regulationCaption}
        avatar={
          <>
            {/* Empty, in order to retain same CardHeader layout as for the Check Layer view */}
          </>
        }
        action={
          options.enableDigitalPlansReport && (
            <>
              <Checkbox
                onChange={(e) => {
                  setControlledRegulations((prev) => {
                    // If layer is already selected using the checkbox…
                    if (isSelected()) {
                      // … let's uncheck the box by the removing element with current layer's ID.
                      return prev.filter((l) => l.id !== selectionFormat.id);
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
