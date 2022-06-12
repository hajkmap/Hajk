// Base
import React, { useEffect } from "react";
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

import FeaturePropsParsing from "components/FeatureInfo/FeaturePropsParsing";

const StyledAccordion = styled(Accordion)(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  "&:not(:first-of-type)": {
    borderTop: 0,
    marginTop: theme.spacing(1),
  },
  "&:not(:last-of-type)": {
    boxShadow: "none",
  },
  "&.MuiAccordion-root.Mui-expanded": {
    borderTop: `1px solid ${theme.palette.divider}`,
  },
}));

const StyledAccordionSummary = styled(AccordionSummary)(({ theme }) => ({
  minHeight: 35,
  padding: "0px 8px",
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

function EstateListItem({ app, estate, setSelectedEstates, source }) {
  // The component that will be shown in the accordion-details is saved in state...
  const [detailsComponent, setDetailsComponent] = React.useState(null);
  // This is not pretty, but it get's the job done for now...
  // We want to create a info-box that depends on the settings on the source.
  // (A info-box is built using the source's "infoBox" markdown-string in combination with the estate-props).
  // To do this, we use a couple of methods found on our feature-props-parser.
  // Since one of the methods is async, we'll save the result in state.
  // TODO: Clean this trash up.
  useEffect(() => {
    // We need a new feature-props-parser for every estate since it saves the config...
    const featurePropsParser = new FeaturePropsParsing({
      globalObserver: app.globalObserver,
      options:
        app.config.mapConfig.tools.find((t) => t.type === "infoclick")
          ?.options || [],
    });
    // When we have a parser, we can create the info-box
    featurePropsParser
      .setMarkdownAndProperties({
        markdown: source.infobox,
        properties: estate.getProperties(),
      })
      .mergeFeaturePropsWithMarkdown()
      .then((MarkdownComponent) => {
        setDetailsComponent(MarkdownComponent);
      });
  }, [estate, source, app]);

  // We're gonna neeed a title on each estate-item. The title can be constructed
  // by using the values of the display-fields set in the source.
  const itemTitle = source.displayFields.reduce((title, displayField) => {
    return title === ""
      ? (title = estate.get(displayField))
      : (title += ` | ${estate.get(displayField)}`);
  }, "");

  // We need a handler for when the user wants to remove a selected estate
  const handleRemoveClick = (e) => {
    // Make sure the event does not propagate to the accordion...
    e.preventDefault();
    e.stopPropagation();
    // Then we'll update the state by removing the estate we wanted to delete
    setSelectedEstates((prevSelected) =>
      prevSelected.filter((prev) => prev.getId() !== estate.getId())
    );
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
        {detailsComponent}
      </AccordionDetails>
    </StyledAccordion>
  );
}

export default EstateListItem;
