import React from "react";

import SearchResultItem from "./SearchResultItem";

import List from "@material-ui/core/List";
import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary";
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails";
import Typography from "@material-ui/core/Typography";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";

const SearchResultGroup = props => {
  if (props.resultList) {
    return Object.entries(props.resultList).map(([key, value]) => {
      const displayFields = value.source.displayFields;
      const features = value.value.features;

      return (
        <ExpansionPanel key={key}>
          <ExpansionPanelSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1a-content"
            id={key}
          >
            <Typography>{value.source.caption}</Typography>
            <span>({value.value.numberReturned})</span>
          </ExpansionPanelSummary>
          <ExpansionPanelDetails>
            <List dense>
              <SearchResultItem
                features={features}
                displayFields={displayFields}
              />
            </List>
          </ExpansionPanelDetails>
        </ExpansionPanel>
      );
    });
  }
};

export default SearchResultGroup;
