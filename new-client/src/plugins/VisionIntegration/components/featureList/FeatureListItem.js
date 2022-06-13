// Base
import React, { useEffect } from "react";
import { styled } from "@mui/material/styles";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
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
    marginTop: theme.spacing(1),
  },
  "&:not(:last-of-type)": {
    boxShadow: "none",
  },
  transition: "unset",
  "&:before": {
    display: "none",
  },
}));

const StyledAccordionSummary = styled(AccordionSummary)(({ theme }) => ({
  minHeight: 35,
  padding: "0px 8px",
  "&.MuiAccordionSummary-root.Mui-expanded": {
    borderBottom: `1px solid ${theme.palette.divider}`,
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

function FeatureListItem({
  app,
  mapViewModel,
  feature,
  setSelectedFeatures,
  source,
}) {
  // The component that will be shown in the accordion-details is saved in state...
  const [detailsComponent, setDetailsComponent] = React.useState(null);
  // This is not pretty, but it get's the job done for now...
  // We want to create a info-box that depends on the settings on the source.
  // (A info-box is built using the source's "infoBox" markdown-string in combination with the feature-props).
  // To do this, we use a couple of methods found on our feature-props-parser.
  // Since one of the methods is async, we'll save the result in state.
  // TODO: Clean this trash up.
  useEffect(() => {
    // If no source was supplied, we cannot create a info-box. Let's instead return
    // a typography stating that theres no info to show
    if (!source) {
      return setDetailsComponent(
        <Typography sx={{ paddingBottom: 2 }}>
          {feature.get("FEATURE_TITLE")}
        </Typography>
      );
    }
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
        properties: feature.getProperties(),
      })
      .mergeFeaturePropsWithMarkdown()
      .then((MarkdownComponent) => {
        setDetailsComponent(MarkdownComponent);
      });
  }, [feature, source, app]);

  // We need a handler for when the user wants to remove a selected estate
  const handleRemoveClick = (e) => {
    // Make sure the event does not propagate to the accordion...
    e.preventDefault();
    e.stopPropagation();
    // Then we'll update the state by removing the estate we wanted to delete
    setSelectedFeatures((prevSelected) =>
      prevSelected.filter((prev) => prev.getId() !== feature.getId())
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
        sx={{ maxWidth: "100%" }}
        expandIcon={<ExpandMoreIcon />}
      >
        <Grid container alignItems="center">
          <Tooltip
            disableInteractive
            title={`Ta bort ${feature.get("FEATURE_TITLE")} från selekteringen`}
          >
            <IconButton
              sx={{ paddingLeft: 0 }}
              disableRipple
              onClick={handleRemoveClick}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
          <Tooltip disableInteractive title={feature.get("FEATURE_TITLE")}>
            <Typography sx={{ maxWidth: "100%" }} noWrap>
              {feature.get("FEATURE_TITLE")}
            </Typography>
          </Tooltip>
        </Grid>
      </StyledAccordionSummary>
      <AccordionDetails sx={{ maxWidth: "100%" }}>
        <Grid item xs={12} sx={{ userSelect: "text" }}>
          <Grid item xs={12}>
            {detailsComponent}
          </Grid>
          <Grid item xs={12}>
            <Tooltip title="Centrera kartan över objektet">
              <Button
                size="small"
                variant="outlined"
                fullWidth
                onClick={() => mapViewModel.zoomToFeatures([feature])}
              >
                Centrera
              </Button>
            </Tooltip>
          </Grid>
        </Grid>
      </AccordionDetails>
    </StyledAccordion>
  );
}

export default FeatureListItem;
