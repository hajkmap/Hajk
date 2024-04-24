import React from "react";
import { styled } from "@mui/material/styles";
import { TwitterPicker } from "react-color";

import { Box, Grid, Typography } from "@mui/material";
import { Paper, Slider } from "@mui/material";

import { Accordion, AccordionDetails, AccordionSummary } from "@mui/material";

import { DRAW_COLORS } from "../../constants";
import StrokeTypeSelector from "./StrokeTypeSelector";
import HajkToolTip from "components/HajkToolTip";

const StyledAccordionSummary = styled(AccordionSummary)(() => ({
  minHeight: 35,
  "&.MuiAccordionSummary-root.Mui-expanded": {
    minHeight: 35,
  },
  "& .MuiAccordionSummary-content": {
    transition: "inherit !important",
    marginTop: 0,
    marginBottom: 0,
    "&.Mui-expanded": {
      marginTop: 0,
      marginBottom: 0,
    },
  },
}));

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
        marginLeft: 4,
        border: color.toLowerCase() === "#ffffff" ? "1px solid black" : null,
      }}
    />
  );
};

// We want to be able to change the opacity of the fill color. Let's
// create a slider that can be used to change the value.
const OpacitySlider = ({ opacity, handleOpacityChange }) => {
  return (
    <Grid item xs={12}>
      <Paper style={{ padding: 8, marginTop: 8 }}>
        <Typography variant="caption">{`Opacitet: ${Math.floor(
          opacity * 100
        )}%`}</Typography>
        <Slider
          size="small"
          min={0}
          max={1}
          value={opacity}
          step={0.01}
          onChange={handleOpacityChange}
          valueLabelFormat={(value) => `${Math.floor(value * 100)}%`}
          valueLabelDisplay="auto"
        />
      </Paper>
    </Grid>
  );
};

// We want to be able to change the opacity of the fill color. Let's
// create a slider that can be used to change the value.
const StrokeWidthSlider = ({ strokeWidth, handleStrokeWidthChange }) => {
  return (
    <Grid item xs={12}>
      <Paper style={{ padding: 8, marginTop: 8 }}>
        <Typography variant="caption">{`Linjebredd: ${strokeWidth}px`}</Typography>
        <Slider
          size="small"
          min={1}
          max={5}
          value={strokeWidth}
          step={0.5}
          onChange={handleStrokeWidthChange}
          valueLabelFormat={(value) => `${value}`}
          valueLabelDisplay="auto"
        />
      </Paper>
    </Grid>
  );
};

const AccordionSummaryContents = (props) => {
  // We need to get the string-representation of the supplied color-object
  // to be used in the color badge... (If it not already a string).
  const colorString =
    typeof props.color === "string"
      ? props.color
      : props.drawModel.getRGBAString(props.color);
  // Then we'll render everything!
  return (
    <Grid container justifyContent="space-between" alignItems="center">
      <Typography variant="button">{props.title}</Typography>
      <Grid container item xs={4} justifyContent="flex-end" alignItems="center">
        {props.showOpacitySlider && (
          <Typography variant="caption">{`${
            typeof props.color === "string"
              ? 100
              : Math.floor(
                  (!isNaN(props.color?.a) ? props.color?.a : 100) * 100
                )
          }%`}</Typography>
        )}
        {typeof props.strokeWidth === "number" && (
          <Typography variant="caption">
            {props.strokeType !== "none" ? `${props.strokeWidth}px` : null}
          </Typography>
        )}
        <ColorBadge color={colorString} />
      </Grid>
    </Grid>
  );
};

// The draw-style-accordion includes a summary showing the current draw-style-settings.
// It also includes tools to update the current style.
const FeatureStyleAccordion = (props) => {
  return (
    <Accordion size="small" style={{ marginBottom: 8 }}>
      <HajkToolTip
        title={`Klicka här för att ändra ${props.title.toLowerCase()}.`}
      >
        <StyledAccordionSummary>
          <AccordionSummaryContents
            title={props.title}
            color={props.color}
            showOpacitySlider={props.showOpacitySlider}
            strokeWidth={props.strokeWidth}
            drawModel={props.drawModel}
            strokeType={props.strokeType}
          />
        </StyledAccordionSummary>
      </HajkToolTip>
      <AccordionDetails style={{ maxWidth: "100%" }}>
        <Grid container>
          {props.showStrokeTypeSelector && (
            <Grid item xs={12} sx={{ mb: 1 }}>
              <StrokeTypeSelector
                handleStrokeTypeChange={props.handleStrokeTypeChange}
                strokeType={props.strokeType}
                activeDrawType={props.activeDrawType}
                setDrawStyle={props.setDrawStyle}
                drawStyle={props.drawStyle}
              />
            </Grid>
          )}
          {props.strokeType !== "none" && (
            <Grid item xs={12}>
              <TwitterPicker
                colors={DRAW_COLORS}
                triangle="hide"
                onChange={props.handleColorChange}
                styles={{
                  default: {
                    card: {
                      maxWidth: "100%",
                      background: "unset", // Hard-coded to white, we don't want that.
                    },
                    swatch: {
                      boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.2)", // boxShadow to make sure the color is visible on white background
                    },
                  },
                }}
                color={props.color}
              />
            </Grid>
          )}
          {props.showOpacitySlider && props.strokeType !== "none" && (
            <OpacitySlider
              handleOpacityChange={props.handleOpacityChange}
              opacity={isNaN(props.color?.a) ? 1 : props.color.a}
            />
          )}
          {props.showStrokeWidthSlider && props.strokeType !== "none" && (
            <StrokeWidthSlider
              handleStrokeWidthChange={props.handleStrokeWidthChange}
              strokeWidth={props.strokeWidth}
            />
          )}
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
};

export default FeatureStyleAccordion;
