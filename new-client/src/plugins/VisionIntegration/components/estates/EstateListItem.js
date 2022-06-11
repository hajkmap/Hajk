// Base
import React from "react";
import { styled } from "@mui/material/styles";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";

import DeleteIcon from "@mui/icons-material/Delete";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const StyledAccordion = styled(Accordion)(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  "&:not(:first-of-type)": {
    borderTop: 0,
    marginTop: theme.spacing(1),
  },
  "&:not(:last-of-type)": {
    borderBottom: 0,
  },
}));

const StyledAccordionSummary = styled(AccordionSummary)(() => ({
  minHeight: 35,
  "&.MuiAccordionSummary-root.Mui-expanded": {
    minHeight: 35,
  },
  "& .MuiAccordionSummary-content": {
    maxWidth: "100%",
    transition: "inherit !important",
    marginTop: 0,
    marginBottom: 0,
    "&.Mui-expanded": {
      marginTop: 0,
      marginBottom: 0,
    },
  },
}));

function EstateListItem(props) {
  // We're gonna neeed a title on each estate-item. The title can be constructed
  // by using the values of the display-fields set in the source.
  const itemTitle = props.source.displayFields.reduce((title, displayField) => {
    return title === ""
      ? (title = props.estate.get(displayField))
      : (title += ` | ${props.estate.get(displayField)}`);
  }, "");

  // We need a handler for when the user wants to remove a selected estate
  const handleRemoveClick = (e) => {
    // Make sure the event does not propagate to the accordion...
    e.preventDefault();
    e.stopPropagation();
    console.log("TODO!");
  };

  return (
    <StyledAccordion
      sx={{ width: "100%" }}
      disableGutters
      square
      TransitionProps={{
        timeout: 0,
      }}
    >
      <StyledAccordionSummary
        style={{ maxWidth: "100%" }}
        expandIcon={<ExpandMoreIcon />}
      >
        <Grid container alignItems="center">
          <Tooltip
            disableInteractive
            title={`Ta bort ${itemTitle} från selekteringen`}
          >
            <IconButton
              sx={{ paddingLeft: 0 }}
              disableRipple
              onClick={handleRemoveClick}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
          <Tooltip disableInteractive title={itemTitle}>
            <Typography style={{ maxWidth: "100%" }} noWrap>
              {itemTitle}
            </Typography>
          </Tooltip>
        </Grid>
      </StyledAccordionSummary>
      <AccordionDetails style={{ maxWidth: "100%" }}>
        <Typography>
          Here's alot of nice info regarding the current estate...
        </Typography>
      </AccordionDetails>
    </StyledAccordion>
  );
}

export default EstateListItem;
