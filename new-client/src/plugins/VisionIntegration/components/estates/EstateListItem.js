// Base
import React from "react";
import { styled } from "@mui/material/styles";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Typography,
} from "@mui/material";

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
  const getTitle = () => {
    return props.source.displayFields.reduce((title, displayField) => {
      return title === ""
        ? (title = props.estate.get(displayField))
        : (title += ` | ${props.estate.get(displayField)}`);
    }, "");
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
        <Typography style={{ maxWidth: "100%" }} noWrap>
          {getTitle()}
        </Typography>
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
