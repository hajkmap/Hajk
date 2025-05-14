import React from "react";
import { styled } from "@mui/material/styles";

import { Grid, Typography } from "@mui/material";
import { Paper, Slider } from "@mui/material";

import { Accordion, AccordionDetails, AccordionSummary } from "@mui/material";
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

const StrokeSizeSlider = ({ radius, handleRadiusChange }) => {
  return (
    <Grid item xs={12}>
      <Paper style={{ padding: 8, marginTop: 8 }}>
        <Typography variant="caption">{`Storlek: ${radius}px`}</Typography>
        <Slider
          sx={{ maxWidth: "170px", marginLeft: "12px" }}
          size="small"
          min={2}
          max={22}
          value={radius}
          onChange={handleRadiusChange}
          marks={[
            { value: 2, label: "Liten" },
            { value: 4 },
            { value: 6 },
            { value: 8 },
            { value: 10 },
            { value: 12, label: "Mellan" },
            { value: 14 },
            { value: 16 },
            { value: 18 },
            { value: 20 },
            { value: 22, label: "Stor" },
          ]}
          step={null}
        />
      </Paper>
    </Grid>
  );
};

const AccordionSummaryContents = (props) => {
  return (
    <Grid container justifyContent="space-between" alignItems="center">
      <Typography variant="button">{props.title}</Typography>
      <Grid container item xs={4} justifyContent="flex-end" alignItems="center">
        {typeof props.radius === "number" && (
          <Typography variant="caption">{`${props.radius}px`}</Typography>
        )}
      </Grid>
    </Grid>
  );
};
const FeaturePointSizeAccordion = (props) => {
  return (
    <Accordion size="small" style={{ marginBottom: 8 }}>
      <HajkToolTip
        title={`Klicka här för att ändra ${props.title.toLowerCase()}.`}
      >
        <StyledAccordionSummary>
          <AccordionSummaryContents
            title={props.title}
            radius={props.radius}
            drawModel={props.drawModel}
          />
        </StyledAccordionSummary>
      </HajkToolTip>
      <AccordionDetails style={{ maxWidth: "100%" }}>
        <Grid container>
          {props.showPointSizeSlider && (
            <StrokeSizeSlider
              radius={props.radius}
              handleRadiusChange={props.handleRadiusChange}
            />
          )}
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
};

export default FeaturePointSizeAccordion;
