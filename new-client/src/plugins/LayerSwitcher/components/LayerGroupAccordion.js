import React from "react";
import { styled } from "@mui/material/styles";
import { Accordion, AccordionDetails, AccordionSummary } from "@mui/material";
import { Box, Typography } from "@mui/material";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

const StyledAccordion = styled(Accordion)(() => ({
  borderRadius: 0,
  boxShadow: "none",
  backgroundImage: "none",
}));

const StyledAccordionSummary = styled(AccordionSummary)(() => ({
  minHeight: 35,
  padding: "0px",
  overflow: "hidden",
  "&.MuiAccordionSummary-root.Mui-expanded": {
    minHeight: 35,
  },
  "& .MuiAccordionSummary-content": {
    transition: "inherit",
    marginTop: 0,
    marginBottom: 0,
    "&.Mui-expanded": {
      marginTop: 0,
      marginBottom: 0,
    },
  },
}));

const StyledAccordionDetails = styled(AccordionDetails)(() => ({
  width: "100%",
  display: "block",
  padding: "0",
}));

const SummaryContainer = styled("div", {
  shouldForwardProp: (prop) => prop !== "border",
})(({ theme, border }) => ({
  display: "flex",
  flexBasis: "100%",
  borderBottom: border
    ? `${theme.spacing(0.2)} solid ${theme.palette.divider}`
    : 0,
}));

const HeadingTypography = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.pxToRem(15),
  flexBasis: "100%",
}));

const ExpandButtonWrapper = styled("div")(() => ({
  float: "left",
}));

function LayerGroupAccordion({
  expanded,
  child,
  toggleable,
  children,
  toggleDetails,
  name,
  layerGroupDetails,
  quickAccess,
}) {
  const [state, setState] = React.useState({ expanded: expanded });

  React.useEffect(() => {
    setState({ expanded: expanded });
  }, [expanded]);

  /**
   * If Group has "toggleable" property enabled, render the toggleDetails children.
   *
   * @returns React.Component
   * @memberof LayerGroupAccordion
   */
  const renderToggleAll = () => {
    if (toggleable) {
      return (
        <SummaryContainer border>
          {toggleDetails}
          <HeadingTypography>{name}</HeadingTypography>
        </SummaryContainer>
      );
    } else if (quickAccess) {
      return (
        <SummaryContainer>
          {quickAccess}
          <HeadingTypography>{name}</HeadingTypography>
          {layerGroupDetails}
        </SummaryContainer>
      );
    } else {
      return (
        <SummaryContainer>
          <HeadingTypography>{name}</HeadingTypography>
        </SummaryContainer>
      );
    }
  };

  const updateCustomProp = (prop, value) => {
    setState((prevState) => ({ ...prevState, [prop]: value }));
  };

  return (
    // If the layerGroup is a child, it should be rendered a tad to the
    // right. Apparently 21px.
    <Box
      sx={{
        marginLeft: child ? "21px" : "0px",
        borderBottom: (theme) =>
          quickAccess
            ? `${theme.spacing(0.2)} solid ${theme.palette.divider}`
            : 0,
      }}
    >
      <StyledAccordion
        expanded={state.expanded}
        TransitionProps={{
          timeout: 0,
        }}
        onChange={() => {
          updateCustomProp("expanded", !state.expanded);
        }}
      >
        <StyledAccordionSummary>
          <ExpandButtonWrapper>
            {state.expanded ? (
              <KeyboardArrowDownIcon
                onClick={() => updateCustomProp("expanded", !state.expanded)}
              />
            ) : (
              <KeyboardArrowRightIcon
                onClick={() => updateCustomProp("expanded", !state.expanded)}
              />
            )}
          </ExpandButtonWrapper>
          {renderToggleAll()}
        </StyledAccordionSummary>
        <StyledAccordionDetails>
          <div>{children}</div>
        </StyledAccordionDetails>
      </StyledAccordion>
    </Box>
  );
}
export default LayerGroupAccordion;
