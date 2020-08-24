import React from "react";
import { withStyles } from "@material-ui/core/styles";

import SearchResultItem from "./SearchResultItem";

import List from "@material-ui/core/List";
import MuiExpansionPanel from "@material-ui/core/ExpansionPanel";
import MuiExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary";
import MuiExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails";
import Typography from "@material-ui/core/Typography";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import MuiPlaceIcon from "@material-ui/icons/Place";
import Chip from "@material-ui/core/Chip";

import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles((theme) => ({
  root: {
    width: "100%",
  },
  heading: {
    fontSize: theme.typography.pxToRem(15),
    fontWeight: theme.typography.fontWeightRegular,
  },
  chip: {
    marginLeft: 8,
  },
}));

const ExpansionPanel = withStyles({
  root: {
    border: "1px solid rgba(0, 0, 0, .125)",
    boxShadow: "none",
    "&:not(:last-child)": {
      borderBottom: 0,
    },
    "&:before": {
      display: "none",
    },
    "&$expanded": {
      margin: "auto",
    },
  },
  expanded: {},
})(MuiExpansionPanel);

const ExpansionPanelSummary = withStyles({
  root: {
    backgroundColor: "rgba(0, 0, 0, .03)",
    borderBottom: "1px solid rgba(0, 0, 0, .125)",
    marginBottom: -1,
    minHeight: 56,
    "&$expanded": {
      minHeight: 56,
    },
  },
  content: {
    "&$expanded": {
      margin: "12px 0",
    },
  },
  expanded: {},
})(MuiExpansionPanelSummary);

const ExpansionPanelDetails = withStyles((theme) => ({
  root: {
    padding: theme.spacing(0),
  },
}))(MuiExpansionPanelDetails);

const PlaceIcon = withStyles((theme) => ({
  root: {
    marginRight: 8,
  },
}))(MuiPlaceIcon);

function SearchResultGroup({
  map,
  featureCollection: { source, value },
  resultsSource,
  checkedItems,
  handleCheckedToggle,
}) {
  const classes = useStyles();

  const numberReturned = value.numberReturned;

  if (numberReturned) {
    return (
      <ExpansionPanel>
        <ExpansionPanelSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1a-content"
        >
          <Typography>
            <PlaceIcon />
            {source.caption}
          </Typography>
          <Chip
            label={numberReturned}
            color="primary"
            className={classes.chip}
          />
        </ExpansionPanelSummary>
        <ExpansionPanelDetails>
          <List dense className={classes.root}>
            {value.features.map((f) => (
              <SearchResultItem
                key={f.id}
                feature={f}
                source={source}
                checkedItems={checkedItems}
                handleCheckedToggle={handleCheckedToggle}
              />
            ))}
          </List>
        </ExpansionPanelDetails>
      </ExpansionPanel>
    );
  } else {
    return null;
  }
}

export default SearchResultGroup;
