import React from "react";

import {
  Typography,
  List,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Tooltip,
} from "@material-ui/core";

import PlaceIcon from "@material-ui/icons/Place";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";

import SearchResultsDatasetFeature from "./SearchResultsDatasetFeature";

export default function SearchResultsDataset({
  featureCollection: { source, value },
  checkedItems,
  handleCheckedToggle,
  setSelectedFeatureAndSource,
}) {
  const numberOfResultsToDisplay =
    value.numberMatched > value.numberReturned
      ? `${value.numberReturned}+`
      : value.numberReturned;
  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography>
          <PlaceIcon />
          {source.caption}
        </Typography>
        <Tooltip
          title={`Visar ${value.numberReturned} av ${value.numberMatched} resultat`}
        >
          <Chip label={numberOfResultsToDisplay} />
        </Tooltip>
      </AccordionSummary>
      <AccordionDetails>
        <List>
          {value.features.map((f) => (
            <SearchResultsDatasetFeature
              key={f.id}
              feature={f}
              source={source}
              checkedItems={checkedItems}
              handleCheckedToggle={handleCheckedToggle}
              setSelectedFeatureAndSource={setSelectedFeatureAndSource}
            />
          ))}
        </List>
      </AccordionDetails>
    </Accordion>
  );
}
