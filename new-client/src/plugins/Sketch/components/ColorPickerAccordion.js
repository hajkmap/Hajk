import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { TwitterPicker } from "react-color";

import { Box, Grid, Typography, Tooltip } from "@material-ui/core";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
} from "@material-ui/core";

// We want to use an accordion-summary, but we have to style it a bit so
// it looks OK. Let's create a styled accordion-summary.
const StyledAccordionSummary = withStyles({
  root: {
    minHeight: 35,
    "&$expanded": {
      minHeight: 35,
    },
  },
  content: {
    transition: "inherit !important",
    marginTop: "0",
    marginBottom: "0",
    "&$expanded": {
      marginTop: "0",
      marginBottom: "0",
    },
  },
  expanded: {},
})(AccordionSummary);

// We want to be able to display the current color. Let's create
// a color-badge component.
const ColorBadge = ({ color }) => {
  return (
    <Box
      style={{
        height: "1.1rem",
        width: "1.1rem",
        backgroundColor: color,
        borderRadius: "10%",
      }}
    />
  );
};

// The color-picker-accordion includes a badge showing the current color
// as well as a color-picker used to set the current color.
const ColorPickerAccordion = (props) => {
  return (
    <Accordion size="small" style={{ marginBottom: 8 }}>
      <Tooltip title={`Klicka här för att ändra ${props.title.toLowerCase()}.`}>
        <StyledAccordionSummary>
          <Grid container justify="space-between" alignItems="center">
            <Typography variant="button">{props.title}</Typography>
            <ColorBadge color={props.color} />
          </Grid>
        </StyledAccordionSummary>
      </Tooltip>
      <AccordionDetails>
        <TwitterPicker
          triangle="hide"
          onChange={props.handleColorChange}
          styles={{
            default: {
              card: {
                background: "unset", // Hard-coded to white, we don't want that.
              },
            },
          }}
          color={props.color}
        />
      </AccordionDetails>
    </Accordion>
  );
};

export default ColorPickerAccordion;
